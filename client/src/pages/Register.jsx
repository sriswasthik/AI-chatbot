export default function Register() {
  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-3xl font-bold mb-8">
        Register
      </h1>

      <form className="space-y-5">
        <input
          type="text"
          placeholder="Name"
          className="w-full rounded-lg bg-gray-900 border border-gray-700 p-3"
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-lg bg-gray-900 border border-gray-700 p-3"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-lg bg-gray-900 border border-gray-700 p-3"
        />

        <button className="w-full bg-blue-600 py-3 rounded-lg hover:bg-blue-700">
          Create Account
        </button>
      </form>
    </div>
  );
}