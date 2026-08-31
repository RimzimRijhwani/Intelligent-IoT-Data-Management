import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { validateEmail, validateLoginPassword } from "../utils/validation";

function Login() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });

  const inputRefs = useRef([]);

  const handleFieldChange = (name, value) => {
    if (name === "email") setEmail(value);
    if (name === "password") setPassword(value);

    if (touched[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: name === "email" ? validateEmail(value) : validateLoginPassword(value),
      }));
    }
  };

  const handleBlur = (name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]: name === "email" ? validateEmail(value) : validateLoginPassword(value),
    }));
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validateLoginPassword(password);

    setFieldErrors({ email: emailError, password: passwordError });
    setTouched({ email: true, password: true });

    if (emailError || passwordError) {
      setMessage("Please fix the highlighted fields before continuing.");
      setMessageType("error");
      return;
    }

    const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers")) || [];
    const legacyUser = JSON.parse(localStorage.getItem("registeredUser"));
    const allUsers = legacyUser ? [...registeredUsers, legacyUser] : registeredUsers;

    if (allUsers.length === 0) {
      setMessage("No registered account found. Please sign up first.");
      setMessageType("error");
      return;
    }

    const matchedUser = allUsers.find(
      (user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password
    );

    if (!matchedUser) {
      setMessage("Invalid email or password.");
      setMessageType("error");
      return;
    }

    setMessage("");
    setStep(2);
  };

  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();

    const enteredCode = otp.join("");

    if (enteredCode.length !== 6) {
      setMessage("Please enter the 6-digit verification code.");
      setMessageType("error");
      return;
    }

    localStorage.setItem("isAuthenticated", "true");
    sessionStorage.setItem("iot_auth", "true");

    setMessage("");
    navigate("/home");
  };

  const handleResendCode = () => {
    setMessage("A new verification code has been sent.");
    setMessageType("success");
  };

  const handleBackToLogin = () => {
    setStep(1);
    setOtp(["", "", "", "", "", ""]);
    setMessage("");
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo">
          <span>IoT</span>
        </div>

        {step === 1 ? (
          <>
            <h1>Welcome Back</h1>

            <p className="login-subtitle">
              Sign in to continue to Intelligent IoT Data Management.
            </p>

            {message && (
              <p
                className={`form-alert ${
                  messageType === "success" ? "success-alert" : "error-alert"
                }`}
              >
                {message}
              </p>
            )}

            <form className="login-form" onSubmit={handleLoginSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  onBlur={(e) => handleBlur("email", e.target.value)}
                  className={touched.email && fieldErrors.email ? "input-error" : ""}
                />
                {touched.email && fieldErrors.email && (
                  <p className="field-error">{fieldErrors.email}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password</label>

                <div className="password-wrapper">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => handleFieldChange("password", e.target.value)}
                    onBlur={(e) => handleBlur("password", e.target.value)}
                    className={touched.password && fieldErrors.password ? "input-error" : ""}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {touched.password && fieldErrors.password && (
                  <p className="field-error">{fieldErrors.password}</p>
                )}
              </div>

              <div className="login-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  Remember me
                </label>

                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="login-button">
                Login
              </button>
            </form>

            <p className="signup-text">
              Don&apos;t have an account? <Link to="/register">Sign up</Link>
            </p>
          </>
        ) : (
          <>
            <h1>Two-Factor Authentication</h1>

            <p className="login-subtitle">
              Enter the 6-digit verification code sent to your email address.
            </p>

            {message && (
              <p
                className={`form-alert ${
                  messageType === "success" ? "success-alert" : "error-alert"
                }`}
              >
                {message}
              </p>
            )}

            <form className="login-form" onSubmit={handleVerifyCode}>
              <div className="otp-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    className="otp-input"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    ref={(el) => (inputRefs.current[index] = el)}
                  />
                ))}
              </div>

              <button type="submit" className="login-button">
                Verify Code
              </button>
            </form>

            <div className="twofactor-actions">
              <button
                type="button"
                className="text-button"
                onClick={handleResendCode}
              >
                Resend Code
              </button>

              <button
                type="button"
                className="text-button"
                onClick={handleBackToLogin}
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default Login;