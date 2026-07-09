export function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    photoURL: user.photoURL,
    role: user.role,
  };
}
