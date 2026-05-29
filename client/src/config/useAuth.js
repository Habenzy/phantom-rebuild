import { useContext } from "react";
import { AuthContext } from "./authContextValue.js";

// Creates user context to be used elsewhere.
export function useAuth() {
  return useContext(AuthContext);
}
