import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";
import { loginSchema } from "../lib/zod/loginSchema";
import { useNavigate } from "react-router-dom";

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setLoading(true);
    setErrorMessage(null);

    const { email, password } = data;

    const { error, data: authData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
    } else {
      const { user } = authData;
      localStorage.setItem(
        "supabase_auth",
        JSON.stringify({ email: user.email, id: user.id })
      );
      setTimeout(() => {
        navigate("/champions");
      }, 1000);
    }
  };

  useEffect(() => {
    const supabase_auth = localStorage.getItem("supabase_auth");
    if (supabase_auth) {
      navigate("/champions");
    }
  }, [navigate]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm mx-auto p-4">
      <h2 className="text-2xl mb-4">Login</h2>

      <div className="mb-3">
        <label className="block mb-1">Email</label>
        <input
          type="email"
          {...register("email")}
          className="w-full border px-2 py-1 rounded"
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="mb-3">
        <label className="block mb-1">Password</label>
        <input
          type="password"
          {...register("password")}
          className="w-full border px-2 py-1 rounded"
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}
      </div>

      {errorMessage && <p className="text-red-500 mb-3">{errorMessage}</p>}

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-orange-100 text-black py-2 rounded hover:bg-orange-200 transition cursor-pointer"
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
