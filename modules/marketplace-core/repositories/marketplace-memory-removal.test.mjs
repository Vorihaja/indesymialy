import assert from "node:assert/strict";
import {
  existsSync,
  readFileSync,
} from "node:fs";
import test from "node:test";

const read = (relativePath) =>
  readFileSync(
    new URL(relativePath, import.meta.url),
    "utf8",
  );

test(
  "Marketplace production wiring does not depend on the removed memory repository",
  () => {
    const removedMemoryRepository =
      new URL(
        "./marketplace-" +
          "memory.repository.ts",
        import.meta.url,
      );

    assert.equal(
      existsSync(
        removedMemoryRepository,
      ),
      false,
    );

    const contract =
      read(
        "./marketplace-store.repository.ts",
      );

    const service =
      read(
        "../services/marketplace.service.ts",
      );

    const runtime =
      read(
        "./marketplace-runtime.repository.ts",
      );

    const factory =
      read(
        "../factories/marketplace.factory.ts",
      );

    assert.match(
      contract,
      /export interface MarketplaceStoreRepository/,
    );

    assert.doesNotMatch(
      contract,
      /const\s+(products|cart|orders|deliveries|transactions)\s*=/,
    );

    assert.doesNotMatch(
      contract,
      /new\s+Map/,
    );

    assert.match(
      service,
      /import type \{ MarketplaceStoreRepository \} from "\.\.\/repositories\/marketplace-store\.repository";/,
    );

    assert.doesNotMatch(
      service,
      /marketplace-memory\.repository/,
    );

    assert.match(
      runtime,
      /import type \{ MarketplaceStoreRepository \} from "\.\/marketplace-store\.repository";/,
    );

    assert.match(
      runtime,
      /implements MarketplaceStoreRepository/,
    );

    assert.doesNotMatch(
      runtime,
      /marketplace-memory\.repository/,
    );

    assert.match(
      factory,
      /createMarketplaceRuntimeRepository/,
    );

    assert.match(
      factory,
      /new MarketplaceService\(createMarketplaceRuntimeRepository\(\)\)/,
    );
  },
);
