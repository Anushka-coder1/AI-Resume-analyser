require("dotenv").config();

const request = require("supertest");
const mongoose = require("mongoose");
const userModel = require("../src/models/user.model");

jest.mock("../src/services/ai.service.js", () => ({}));

const app = require("../src/app");
const connectToDB = require("../src/config/database");

beforeAll(async () => {
  await connectToDB();
});

afterAll(async () => {
  await mongoose.connection.close();
});

// checking express app working
describe("Express App", () => {

  test("should respond to a request", async () => {

    const response = await request(app)
      .get("/");

    expect(response.statusCode).not.toBe(500);
  });


});

// // testing registration
// describe("POST /api/auth/register", () => {

//   test("should register a new user", async () => {

//     const response = await request(app)
//       .post("/api/auth/register")
//       .send({
//         username: "jestuser1",
//         email: "jestuser1@example.com",
//         password: "Password123"
//       });

//     console.log("Status:", response.statusCode);
//     console.log("Body:", response.body);

//     expect(response.statusCode).toBe(201);
//     expect(response.body.message).toBe("User created successfully");
//     expect(response.body.user).toHaveProperty("id");
//     expect(response.body.user.username).toBe("jestuser1");
//     expect(response.body.user.email).toBe("jestuser1@example.com");
//   });


//   test("should return 400 when required fields are missing", async () => {

//     const response = await request(app)
//       .post("/api/auth/register")
//       .send({
//         username: "jestuser"
//       });

//     console.log("Status:", response.statusCode);
//     console.log("Body:", response.body);

//     expect(response.statusCode).toBe(400);
//     expect(response.body.message)
//       .toBe("Please provide username, email and password");
//   });


//   afterEach(async () => {
//     await userModel.deleteOne({
//       email: "jestuser1@example.com"
//     });
//   });

// });