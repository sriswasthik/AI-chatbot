import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

import AuthCard from "../components/ui/AuthCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

import { registerUser } from "../services/auth.service";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();

  const { setUser, setToken } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password =
        "Password must be at least 8 characters";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword =
        "Passwords do not match";
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

      const data = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      toast.success("Account created successfully");

      /*
      | Registration returns a token, so sign the user straight in rather
      | than bouncing them to the login form to retype what they just
      | entered.
      */

      setToken(data.token);
      setUser(data.user);

      navigate("/", { replace: true });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Registration failed"
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
        title="Create Account"
        description="Join the Enterprise AI Chatbot platform."
        footer={
          <>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Sign In
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            icon={User}
            placeholder="Enter your full name"
            value={form.name}
            error={errors.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />

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
            placeholder="Create a password"
            value={form.password}
            error={errors.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
          />

          <Input
            label="Confirm Password"
            icon={Lock}
            type="password"
            placeholder="Confirm your password"
            value={form.confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) =>
              setForm({
                ...form,
                confirmPassword: e.target.value,
              })
            }
          />

          <Button loading={loading} type="submit">
            <div className="flex items-center justify-center gap-2">
              Create Account
              <ArrowRight size={18} />
            </div>
          </Button>
        </form>
      </AuthCard>
    </motion.div>
  );
}