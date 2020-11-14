import React from "react";
import { useSWRInfinite } from "swr";
import { GraphQLClient, gql } from 'graphql-request'

const COUNTRY_ENDPOINT = "https://countries-274616.ew.r.appspot.com/"
const LIMIT = 6

const GET_COUNTRIES = gql`query($limit: Int!, $offset: Int!) {
	Country (first:$limit, offset:$offset) {
    _id
    name
  }
}
`;

const hasuraGraphQLClient = new GraphQLClient(COUNTRY_ENDPOINT)

const countryFetcher = (query, limit, offset) => 
  ( 
    hasuraGraphQLClient.request(
      query, { 
        limit: limit, 
        offset: ( offset * limit ),
      }).then(data => {
        // console.log(data)
        return data.Country
    })
  )


export default function App({countriesInitialData}) {
  console.log(countriesInitialData)

  const { data, error, mutate, size, setSize, isValidating } = useSWRInfinite(offset => 
    [ GET_COUNTRIES, LIMIT, offset], 
    countryFetcher,
    { initialData: [countriesInitialData], 
      revalidateAll: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: false
    }
  )

  error && console.log(error)
  if (error) return <p>{JSON.stringify(error)}</p>

  const countries = data ? [].concat(...data) : [];
  const isLoadingInitialData = !data && !error;
  const isLoadingMore = isLoadingInitialData || (data && typeof data[size - 1] === "undefined");

  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.length < LIMIT);

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <p>
        showing {size} page(s) of {isLoadingMore ? "..." : countries.length}{" "}
        countries{" "}
        <button
          disabled={isLoadingMore || isReachingEnd}
          onClick={() => setSize(size + 1)}
        >
          {isLoadingMore
            ? "loading..."
            : isReachingEnd
            ? "no more countries"
            : "load more"}
        </button>
      </p>
      {isEmpty ? <p>Yay, no countries found.</p> : null}
      {countries.map((country) => {
        return (
          <p key={country.name} style={{ margin: "6px 0" }}>
            - {country.name}
          </p>
        );
      })}
    </div>
  );
}

export async function getStaticProps() {

  const countriesInitialData = await countryFetcher(
    GET_COUNTRIES, 
    LIMIT, 
    0
  )

  return {
    props: { 
      countriesInitialData
    }
  }
}
