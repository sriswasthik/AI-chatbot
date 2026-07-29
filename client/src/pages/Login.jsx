import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function Login() {
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
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    }

    return newErrors;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    // Temporary
    setTimeout(() => {
      setLoading(false);
      alert("Backend will be connected in Sprint 7");
    }, 1500);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <h1 className="mb-2 text-3xl font-bold text-white">
          Welcome Back
        </h1>

        <p className="mb-8 text-slate-400">
          Sign in to continue to your AI workspace.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
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

          <Button
            loading={loading}
            type="submit"
          >
            <div className="flex justify-center items-center gap-2">
              Sign In
              <ArrowRight size={18} />
            </div>
          </Button>
        </form>

        <p className="mt-6 text-center text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-400 hover:text-blue-300"
          >
            Create one
          </Link>
        </p>
      </Card>
    </motion.div>
  );
}