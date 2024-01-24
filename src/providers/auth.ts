import { AuthBindings } from "@refinedev/core";
import { API_URL, dataProvider } from "./data";

//for demo purposes
export const authCredentials = {
  email: "michael.scott@dundermifflin.com",
  password: "demodemo",
};

export const authProvider: AuthBindings = {
  login: async ({ email }) => {
    try {
      //Calling the login mutation
      // DataProvider.custom is used to make a custom request to the GraphQL API
      // this will call dataProvider which will go through the fetchWrapper function
      const { data } = await dataProvider.custom({
        url: API_URL,
        method: "post",
        headers: {},
        meta: {
          variables: { email },
          //pass the email to see if the user exists and if so, return the access token
          rawQuery: `
            mutation login($email:String!){
              login(loginInput: {email: $email}){
                accessToken
              }
            }`,
        },
      });

      //save the accessToken to localStorage
      localStorage.setItem("access_token", data.login.accessToken);

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (e) {
      const error = e as Error;

      return {
        success: false,
        error: {
          message: "message" in error ? error.message : "Login Failed",
          name: "name" in error ? error.name : "Invalid email or password",
        },
      };
    }
  },
  //removing the access token from localStorage
  logout: async () => {
    localStorage.removeItem("access_token");
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  onError: async (error) => {
    // check to see if the error is an authentication error
    // set logout is true if it is
    if (error.statusCode === "UNAUTHENTICATED") {
      return {
        logout: true,
        ...error,
      };
    }
    return { error };
  },
  //getting the indentity of user
  check: async () => {
    try {
      ///get the identity of the user
      // to know if the user is authenticated or not
      await dataProvider.custom({
        url: API_URL,
        method: "post",
        headers: {},
        meta: {
          rawQuery: `query Me{ me { name}}`,
        },
      });
      //if the user is authenticated, redirect to the home page
      return {
        authenticated: true,
        redirectTo: "/",
      };
    } catch (error) {
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }
  },
  //get user information
  getIdentity: async () => {
    const accessToken = localStorage.getItem("access_token");

    try {
      //call the GraphQL API to get the user information
      // we're using me:any because the graphql api doesnt have a type for the me query yet
      // we'll add some queries and mutations to the graphql api later and chagne this to User which will be generated by codegen
      const { data } = await dataProvider.custom<{ me: any }>({
        url: API_URL,
        method: "post",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        meta: {
          //get the userinformation such as name, email, etc
          rawQuery: `query Me{me{id name email phone jobTitle timezone avatarUrl}}`,
        },
      });
      return data.me;
    } catch (error) {
      return undefined;
    }
  },
};