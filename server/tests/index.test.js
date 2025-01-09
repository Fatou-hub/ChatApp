import * as chai from "chai";
import chaiHttp from "chai-http";
import app from "../index.js";

const { expect } = chai;
chai.use(chaiHttp);

describe("Index.js Routes", () => {
  it("should load the home route", (done) => {
    chai
      .request(app)
      .get("/")
      .end((err, res) => {
        expect(res).to.have.status(404); // Modifier en fonction de votre implémentation.
        done();
      });
  });

  it("should load the auth route", (done) => {
    chai
      .request(app)
      .get("/api/auth")
      .end((err, res) => {
        expect(res).to.have.status(200); // Modifier en fonction de votre implémentation.
        done();
      });
  });
});
