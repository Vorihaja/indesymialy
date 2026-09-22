import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const legacyFiles = [
  "./repositories/admin-memory.repository.ts",
  "./services/admin-core.service.ts",
  "./use-cases/get-admin-domain.use-case.ts",
  "./factories/admin-core.factory.ts",
  "./hooks/useAdminDomain.ts",
  "./features/AdminDomainFeature.tsx",
];

const adminCoreIndex = fs.readFileSync(
  new URL(
    "./index.ts",
    import.meta.url,
  ),
  "utf8",
);

const adminFeaturesIndex = fs.readFileSync(
  new URL(
    "../admin/features/index.ts",
    import.meta.url,
  ),
  "utf8",
);

const adminPage = fs.readFileSync(
  new URL(
    "../../app/admin/page.tsx",
    import.meta.url,
  ),
  "utf8",
);

const erpAdminPage = fs.readFileSync(
  new URL(
    "../../app/dashboard/admin/page.tsx",
    import.meta.url,
  ),
  "utf8",
);

test(
  "legacy admin-core memory infrastructure is deleted",
  () => {
    for (const file of legacyFiles) {
      assert.equal(
        fs.existsSync(
          new URL(
            file,
            import.meta.url,
          ),
        ),
        false,
        `legacy file still exists: ${file}`,
      );
    }

    assert.equal(
      fs.existsSync(
        new URL(
          "../admin/features/AdminControlCenterFeature.tsx",
          import.meta.url,
        ),
      ),
      false,
    );
  },
);

test(
  "admin-core public API keeps shared types and AdminDomainView",
  () => {
    assert.match(
      adminCoreIndex,
      /export \* from "\.\/types";/,
    );

    assert.match(
      adminCoreIndex,
      /export \* from "\.\/components\/AdminDomainView";/,
    );

    for (const legacyExport of [
      "admin-memory.repository",
      "admin-core.service",
      "get-admin-domain.use-case",
      "admin-core.factory",
      "useAdminDomain",
      "AdminDomainFeature",
    ]) {
      assert.doesNotMatch(
        adminCoreIndex,
        new RegExp(
          legacyExport.replaceAll(
            ".",
            "\\.",
          ),
        ),
      );
    }
  },
);

test(
  "admin feature barrel no longer exposes obsolete control center",
  () => {
    assert.doesNotMatch(
      adminFeaturesIndex,
      /AdminControlCenterFeature/,
    );

    assert.match(
      adminFeaturesIndex,
      /AdminRouteFeature/,
    );

    assert.match(
      adminFeaturesIndex,
      /AdminDetailFeature/,
    );
  },
);

test(
  "persistent admin dashboard remains canonical for app admin",
  () => {
    assert.match(
      adminPage,
      /AdminDashboard/,
    );

    assert.doesNotMatch(
      adminPage,
      /AdminControlCenterFeature/,
    );
  },
);

test(
  "ERP admin root remains independent from legacy memory dashboard",
  () => {
    assert.match(
      erpAdminPage,
      /UniversalErpPrototype/,
    );

    assert.doesNotMatch(
      erpAdminPage,
      /AdminControlCenterFeature/,
    );
  },
);