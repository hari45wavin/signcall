import { describe, it, expect } from "vitest";
import { localClientTranslate } from "@/lib/translate";

describe("localClientTranslate", () => {
  it("translates common ASL idioms accurately in conversational tone", () => {
    expect(localClientTranslate("NICE MEET YOU", "conversational")).toBe("It's nice to meet you.");
    expect(localClientTranslate("ME DEAF", "conversational")).toBe("I am deaf, communicating via sign language.");
    expect(localClientTranslate("HELLO", "conversational")).toBe("Hello everyone!");
    expect(localClientTranslate("NAME YOU WHAT", "conversational")).toBe("What is your name?");
  });

  it("adapts output based on selected tone", () => {
    expect(localClientTranslate("NICE MEET YOU", "professional")).toBe("It is a pleasure to meet you.");
    expect(localClientTranslate("NICE MEET YOU", "casual")).toBe("Great meeting you!");
    expect(localClientTranslate("NICE MEET YOU", "concise")).toBe("Nice to meet you.");

    expect(localClientTranslate("THANK YOU", "professional")).toBe("Thank you very much for your time.");
    expect(localClientTranslate("THANK YOU", "casual")).toBe("Thanks a lot!");
    expect(localClientTranslate("THANK YOU", "concise")).toBe("Thank you.");
  });

  it("handles desire and request patterns correctly", () => {
    expect(localClientTranslate("ME WANT WATER PLEASE", "conversational")).toBe("I would like water, please.");
    expect(localClientTranslate("ME WANT COFFEE", "casual")).toBe("I'd love some coffee!");
    expect(localClientTranslate("ME WANT ASSISTANCE", "professional")).toBe("I would appreciate assistance, please.");
  });

  it("formats name introduction patterns", () => {
    expect(localClientTranslate("MY NAME HARI", "conversational")).toBe("My name is Hari.");
    expect(localClientTranslate("ME NAME ALEX", "conversational")).toBe("My name is Alex.");
  });

  it("applies punctuation correctly for question phrases and generic sentences", () => {
    expect(localClientTranslate("HOW ARE YOU", "conversational")).toBe("How are you?");
    expect(localClientTranslate("WHERE IS THE RESTROOM", "conversational")).toBe("Where is the restroom?");
    expect(localClientTranslate("I AM READY", "conversational")).toBe("I am ready.");
  });

  it("returns empty string for empty input", () => {
    expect(localClientTranslate("")).toBe("");
    expect(localClientTranslate("   ")).toBe("");
  });
});
