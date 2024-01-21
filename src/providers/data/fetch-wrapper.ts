import { GraphQLFormattedError } from "graphql";

type Error = {
  message: string;
  statusCode: string;
};
//create custom fetch wrapper to handle errors
//code reusability
const customFetch = async (url: string, options: RequestInit) => {
  const accessToken = localStorage.getItem("accessToken"); // get token from local storage
  const headers = options.headers as Record<string, string>; // get headers from options

  return await fetch(url, {
    ...options,
    headers: {
      ...headers,
      Authorization: headers?.Authorization || `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true", //handing CORS Issues with apollo (Graph QL client making request with GraphQL Server)
    },
  });
};

const getGraphQLErrors = (
  body: Record<"errors", GraphQLFormattedError[] | undefined>
): Error | null => {
  if (!body) {
    return {
      message: "Unknown error",
      statusCode: "INTERNAL_SERVER_ERROR",
    };
  }

  if ("errors" in body) {
    const errors = body?.errors;
    const messages = errors?.map((error) => error?.message)?.join("");
    const code = errors?.[0]?.extensions?.code;

    return {
      message: messages || JSON.stringify(errors),
      statusCode: code || 500,
    };
  }
  return null;
};

//CUSTOM FETCH WRAPPER
export const fetchWrapper = async (url: string, options: RequestInit) => {
  const response = await customFetch(url, options);
  //cloning the response so that when response is first consumed, it is not available for the second time. To make it available for the second time, we clone it
  const responseClone = response.clone();
  const body = await responseClone.json();

  const error = getGraphQLErrors(body);

  if (error) {
    throw error;
  }
};
