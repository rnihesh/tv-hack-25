import React, { useContext } from "react";
import { SignUp } from "@clerk/clerk-react";
import { ThemeContext } from "../contexts/ThemeContext";
import { dark } from "@clerk/themes";

function Signup() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  return (
    <div className="d-flex justify-content-center align-items-center h-100">
      <SignUp
        appearance={{
          baseTheme: isDark ? dark : undefined,
          variables: {
            colorPrimary: "rgb(216, 104, 97)",
          },
        }}
        fallbackRedirectUrl="/"
        signInUrl="/signin"
      />
    </div>
  );
}

export default Signup;
