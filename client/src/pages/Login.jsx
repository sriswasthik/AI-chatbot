import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

import AuthCard from "../components/ui/AuthCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

import { AuthContext } from "../context/AuthContext";
import { loginUser } from "../services/auth.service";

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setToken } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    }

    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setErrors({});
      setLoading(true);

      const data = await loginUser(form);

      setUser(data.user);
      setToken(data.token);

      toast.success("Login successful");

      navigate("/");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <AuthCard
        title="Welcome Back"
        description="Sign in to continue to your AI workspace."
        footer={
          <>
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Create one
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            icon={Mail}
            placeholder="Enter your email"
            value={form.email}
            error={errors.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <Input
            label="Password"
            icon={Lock}
            type="password"
            placeholder="Enter your password"
            value={form.password}
            error={errors.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
          />

          <Button loading={loading} type="submit">
            <div className="flex items-center justify-center gap-2">
              Sign In
              <ArrowRight size={18} />
            </div>
          </Button>
        </form>
      </AuthCard>
    </motion.div>
  );
}