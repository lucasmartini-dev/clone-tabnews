import email from "infra/email.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "Nodemailer <example@nodemailer.com>",
      to: "localhost@mailcatcher.me",
      subject: "My Walden",
      text: "I do not wish to evade the world, yet I will forever build my own. Forever my home!",
    });

    await email.send({
      from: "Nodemailer <example@nodemailer.com>",
      to: "localhost@mailcatcher.me",
      subject: "Last Ride of the Day",
      text: "We live in every moment but this one...",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<example@nodemailer.com>");
    expect(lastEmail.recipients[0]).toBe("<localhost@mailcatcher.me>");
    expect(lastEmail.subject).toBe("Last Ride of the Day");
    expect(lastEmail.text).toBe("We live in every moment but this one...\n");
  });
});
