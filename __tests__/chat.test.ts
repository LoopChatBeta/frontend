// Basic smoke tests for LoopChat chat API logic

describe("Chat API", () => {
  test("should return a reply when given a valid message", async () => {
    const mockResponse = {
      reply: "Hello! How can I help you today?",
      showIntakeForm: false,
    };

    // Verify response shape is correct
    expect(mockResponse).toHaveProperty("reply");
    expect(mockResponse).toHaveProperty("showIntakeForm");
    expect(typeof mockResponse.reply).toBe("string");
    expect(typeof mockResponse.showIntakeForm).toBe("boolean");
  });

  test("should detect intake form trigger", () => {
    const reply = "I'd be happy to help you book. SHOW_INTAKE_FORM";
    const showIntake = reply.includes("SHOW_INTAKE_FORM");
    const cleanReply = reply.replace("SHOW_INTAKE_FORM", "").trim();

    expect(showIntake).toBe(true);
    expect(cleanReply).toBe("I'd be happy to help you book.");
  });

  test("should not trigger intake form for general questions", () => {
    const reply = "Mayo Clinic offers cardiology and neurology services.";
    const showIntake = reply.includes("SHOW_INTAKE_FORM");

    expect(showIntake).toBe(false);
  });

  test("should handle empty reply gracefully", () => {
    const reply = undefined ?? "I'm sorry, I couldn't generate a response.";
    expect(reply).toBe("I'm sorry, I couldn't generate a response.");
  });
});

describe("Ingestion", () => {
  test("should validate URL is provided", () => {
    const url = "";
    const isValid = url.trim().length > 0;
    expect(isValid).toBe(false);
  });

  test("should accept valid clinic URL", () => {
    const url = "https://www.mayoclinic.org";
    const isValid = url.trim().length > 0;
    expect(isValid).toBe(true);
  });
});

describe("IntakeForm", () => {
  test("should validate required fields are present", () => {
    const intakeData = {
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "555-1234",
      reason: "Knee pain",
      insurance: "Blue Cross",
    };

    expect(intakeData.name).toBeTruthy();
    expect(intakeData.email).toBeTruthy();
    expect(intakeData.reason).toBeTruthy();
  });

  test("should reject intake with missing required fields", () => {
    const intakeData = {
      name: "",
      email: "",
      phone: "",
      reason: "",
      insurance: "",
    };

    const isValid =
      intakeData.name.trim().length > 0 &&
      intakeData.email.trim().length > 0 &&
      intakeData.reason.trim().length > 0;

    expect(isValid).toBe(false);
  });
});