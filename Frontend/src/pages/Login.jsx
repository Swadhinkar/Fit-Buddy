import { useState,useContext } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/axios";
import { AuthContext } from "../components/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("API BASE:", import.meta.env.VITE_API_BASE_URL)
    api
      .post('/user/login', formData)
      .then((res) => {
        toast.success('Login successful');
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        window.location.href = '/';
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || 'Invalid credentials');
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[rgb(var(--body-color))]">
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
              Welcome Back
            </h1>
            <p className="text-sm text-[rgb(var(--slate-500))]">
              Log in to continue your fitness journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
              Sign In
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-[rgb(var(--slate-500))]">
            Don’t have an account?{" "}
            <a
              href="/user/signup"
              className="font-semibold text-[rgb(var(--primary))] hover:underline cursor-pointer"
            >
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
