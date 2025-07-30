import React, { useContext } from "react";
import { SignIn } from "@clerk/clerk-react";
import { ThemeContext } from "../contexts/ThemeContext";
import { dark } from "@clerk/themes";

function Signin() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  return (
    <div className="d-flex justify-content-center align-items-center h-100">
      <SignIn
        appearance={{
          baseTheme: isDark ? dark : undefined,
          variables: {
            colorPrimary: "rgb(216, 104, 97)",
          },
        }}
        fallbackRedirectUrl="/"
        signUpUrl="/signup"
      />
    </div>
  );
}

export default Signin;
