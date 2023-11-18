import React, { useContext, useState, useEffect } from "react";
import { auth } from "./firebase.js";

const AuthContext = React.createContext();

//creates user context to be used elsewhere
export function useAuth() {
  return useContext(AuthContext);
}

//provides context for and sets the user
export function AuthProvider({ children }) {
  //tracks logged-in user / user variable
  const [loggedUser, setLoggedUser] = useState();
  //initial loading state
  const [loading, setLoading] = useState(true);

  //**---------------basic functions for the user---------------**//
  // note: if db other than firebase is ever used,
  // one should just have to change these for things to still work
  function login(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  }

  function logout() {
    return auth.signOut();
  }

  function resetPassword(email) {
    return auth.sendPasswordResetEmail(email);
  }
  //---------------------------------------------------------//

  //sets user once as component mounts
  useEffect(() => {
    //unsubscribe is returned from onAuth method when component unmounts
    const unsubscribe = auth.onAuthStateChanged((user) => {
      //verify to see if there's a user and sets the user
      setLoggedUser(user);
      //user starts as null & sets itself (firebase property that sets local storage/tokens)
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  //value provided by authentication as part of context
  const value = {
    loggedUser,
    login,
    logout,
    resetPassword,
  };

  //provides context to children above - value object passed as prop
  //inside is a check that only renders children, if there's no loading

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}