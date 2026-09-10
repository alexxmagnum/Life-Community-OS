import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dateFromWhenPreset,
  experienceComposerConfigForKind,
  experienceKindForCreationAction,
  listExperienceComposerKindOptions,
  parseExperienceComposerKindParam,
  validateExperienceComposer,
  type ExperienceComposerFormState,
} from "./experience-composer";

const baseState = (): ExperienceComposerFormState => ({
  title: "Jugar al pádel",
  description: "",
  category: "sport",
  activitySlug: "padel",
  format: "",
  date: "2026-09-12",
  time: "19:30",
  endTime: "",
  location: "Pista 1",
  resourceId: "",
  capacity: "4",
  audience: "territory",
});

describe("Experience Composer kind config", () => {
  it("exposes Plan | Experiencia | Evento options", () => {
    const options = listExperienceComposerKindOptions();
    assert.deepEqual(
      options.map((item) => item.id),
      ["plan", "experience", "event"],
    );
  });

  it("derives CTAs and questions from kind", () => {
    assert.equal(
      experienceComposerConfigForKind("plan").primaryCta,
      "Crear plan",
    );
    assert.equal(
      experienceComposerConfigForKind("experience").primaryCta,
      "Crear experiencia",
    );
    assert.equal(
      experienceComposerConfigForKind("event").primaryCta,
      "Crear evento",
    );
    assert.equal(
      experienceComposerConfigForKind("plan").question.includes("apetece"),
      true,
    );
    assert.equal(
      experienceComposerConfigForKind("event").question.includes("organizar"),
      true,
    );
  });

  it("maps creation actions to kind", () => {
    assert.equal(experienceKindForCreationAction("plan_create"), "plan");
    assert.equal(
      experienceKindForCreationAction("experience_create"),
      "experience",
    );
    assert.equal(experienceKindForCreationAction("event_create"), "event");
    assert.equal(experienceKindForCreationAction("help_request"), null);
  });

  it("parses kind query param with meeting → plan", () => {
    assert.equal(parseExperienceComposerKindParam("event"), "event");
    assert.equal(parseExperienceComposerKindParam("meeting"), "plan");
    assert.equal(parseExperienceComposerKindParam(null), "experience");
  });

  it("validates plan without requiring description", () => {
    const plan = experienceComposerConfigForKind("plan");
    assert.equal(validateExperienceComposer(plan, baseState(), "publish"), null);
    assert.equal(
      validateExperienceComposer(
        plan,
        { ...baseState(), description: "" },
        "publish",
      ),
      null,
    );
  });

  it("requires description for experience publish", () => {
    const experience = experienceComposerConfigForKind("experience");
    const err = validateExperienceComposer(
      experience,
      { ...baseState(), description: "" },
      "publish",
    );
    assert.ok(err);
    assert.match(err, /descripción/i);
  });

  it("allows event publish without capacity when not required", () => {
    const event = experienceComposerConfigForKind("event");
    assert.equal(
      event.requiredForPublish.includes("capacity"),
      false,
    );
    assert.equal(
      validateExperienceComposer(
        event,
        { ...baseState(), title: "Noche de música", capacity: "" },
        "publish",
      ),
      null,
    );
  });

  it("draft only requires title", () => {
    const plan = experienceComposerConfigForKind("plan");
    assert.equal(
      validateExperienceComposer(
        plan,
        { ...baseState(), title: "Borrador", date: "", time: "", location: "" },
        "draft",
      ),
      null,
    );
    assert.ok(
      validateExperienceComposer(
        plan,
        { ...baseState(), title: "" },
        "draft",
      ),
    );
  });

  it("preserves compatible fields conceptually across kinds", () => {
    const shared = baseState();
    const planOk = validateExperienceComposer(
      experienceComposerConfigForKind("plan"),
      shared,
      "publish",
    );
    const eventOk = validateExperienceComposer(
      experienceComposerConfigForKind("event"),
      { ...shared, title: "Fiesta" },
      "publish",
    );
    assert.equal(planOk, null);
    assert.equal(eventOk, null);
  });

  it("computes when presets without hardcoding demo places", () => {
    const fixed = new Date("2026-09-10T12:00:00");
    assert.equal(dateFromWhenPreset("today", fixed), "2026-09-10");
    assert.equal(dateFromWhenPreset("tomorrow", fixed), "2026-09-11");
    assert.equal(dateFromWhenPreset("weekend", fixed), "2026-09-12");
  });
});
