function status(request, response) {
  response.status(200).json({ key: "they are above average" });
}

export default status;
