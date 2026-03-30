import { useState } from "react";
import toast from "react-hot-toast";
import api from "../utils/axios";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Password and Confirm Password do not match");
      return;
    }

    api
      .post('/user/signup', formData)
      .then(() => {
        toast.success("Registered Successfully");
        setTimeout(() => (window.location.href = "/"), 1500);
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || "Something went wrong");
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[rgb(var(--body-color))]">
      <div className="w-full max-w-md">
        <div
          className="
            rounded-xl p-8 space-y-6
            bg-[rgb(var(--card-depth-0))]
            border border-[rgb(var(--card-depth-1))]
            shadow-2xl
          "
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))]">
              Create Account
            </h1>
            <p className="text-sm text-[rgb(var(--text-primary))]">
              Join FitBuddy today and start your fitness journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="text-sm font-medium text-[rgb(var(--text-muted))]">
                Full Name
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-transparent
                  border-2 border-[rgb(var(--card-depth-1))]
                  focus:border-[rgb(var(--primary))]
                  outline-none
                  text-[rgb(var(--text-primary))]
                "
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-[rgb(var(--text-muted))]">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-transparent
                  border-2 border-[rgb(var(--card-depth-1))]
                  focus:border-[rgb(var(--primary))]
                  outline-none
                  text-[rgb(var(--text-primary))]
                "
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-[rgb(var(--text-muted))]">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-transparent
                  border-2 border-[rgb(var(--card-depth-1))]
                  focus:border-[rgb(var(--primary))]
                  outline-none
                  text-[rgb(var(--text-primary))]
                "
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-[rgb(var(--text-muted))]">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-transparent
                  border-2 border-[rgb(var(--card-depth-1))]
                  focus:border-[rgb(var(--primary))]
                  outline-none
                  text-[rgb(var(--text-primary))]
                "
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="
                w-full py-3 rounded-lg font-bold text-white
                bg-[rgb(var(--primary))]
                hover:bg-[rgb(var(--primary-hover))]
                transition-transform hover:scale-[1.03]
              "
            >
              Create Account
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-[rgb(var(--text-muted))]">
            Already have an account?{" "}
            <a
              href="/user/login"
              className="font-semibold text-[rgb(var(--primary))] hover:underline cursor-pointer"
            >
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
