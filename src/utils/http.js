export function publicUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export function asyncHandler(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}
