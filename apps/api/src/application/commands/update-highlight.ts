import type { Highlight, HighlightRepository } from "../../domain/highlight/index.js";
import { HighlightEntity, HighlightId } from "../../domain/highlight/index.js";
import { err, ok } from "neverthrow";
import type { DomainError } from "../../domain/shared/index.js";
import type { ResultAsync } from "neverthrow";

interface UpdateHighlightDeps {
  readonly highlightRepo: HighlightRepository;
}

interface UpdateHighlightInput {
  readonly id: string;
  readonly note?: string | null;
  readonly color?: string;
}

const updateHighlight = (
  deps: UpdateHighlightDeps,
): ((input: UpdateHighlightInput) => ResultAsync<Highlight, DomainError>) =>
  function executeUpdateHighlight(
    input: UpdateHighlightInput,
  ): ResultAsync<Highlight, DomainError> {
    return HighlightId.create(input.id)
      .asyncAndThen((id) =>
        deps.highlightRepo.findById(id).andThen((existing) => {
          if (!existing) {
            return err({ id: input.id, type: "HIGHLIGHT_NOT_FOUND" as const });
          }
          let updated = existing;
          if ("note" in input) {
            updated = HighlightEntity.updateNote(updated, input.note ?? null);
          }
          if ("color" in input && typeof input.color === "string" && input.color !== "") {
            updated = HighlightEntity.updateColor(updated, input.color);
          }
          return ok(updated);
        }),
      )
      .andThen((highlight) => deps.highlightRepo.save(highlight));
  };

export { updateHighlight };
