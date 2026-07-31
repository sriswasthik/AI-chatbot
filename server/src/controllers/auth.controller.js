const users = [];

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Check existing user
    const existingUser = users.find(
      (user) => user.email === email
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists.",
      });
    }

    // Temporary user object
    const user = {
      id: Date.now(),
      name,
      email,
      password,
    };

    users.push(user);

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};