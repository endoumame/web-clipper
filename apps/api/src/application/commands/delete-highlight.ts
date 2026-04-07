import { err, ok } from "neverthrow";
import type { DomainError } from "../../domain/shared/index.js";
import { HighlightIdVO } from "../../domain/highlight/index.js";
import type { HighlightRepository } from "../../domain/highlight/index.js";
import type { ResultAsync } from "neverthrow";

interface DeleteHighlightDeps {
  readonly highlightRepo: HighlightRepository;
}

const deleteHighlight = (
  deps: DeleteHighlightDeps,
): ((id: string) => ResultAsync<void, DomainError>) =>
  function executeDeleteHighlight(id: string): ResultAsync<void, DomainError> {
    return HighlightIdVO.create(id)
      .asyncAndThen((highlightId) =>
        deps.highlightRepo.findById(highlightId).andThen((existing) => {
          if (!existing) {
            return err({ id, type: "HIGHLIGHT_NOT_FOUND" as const });
          }
          return ok(highlightId);
        }),
      )
      .andThen((highlightId) => deps.highlightRepo.delete(highlightId));
  };

export { deleteHighlight };
