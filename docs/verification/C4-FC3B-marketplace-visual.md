# C4-FC3B — Indesy Bazar visual acceptance

## Purpose

This validation concerns the real Supabase-backed public Marketplace.

The following sources are not accepted as production runtime authorities:

- `modules/marketplace-prototype`
- `modules/erp-marketplace/mocks.ts`

The public Marketplace must use the real Marketplace modules and persistent
Supabase authorities already present in the project.

## Start the application

```powershell
npm.cmd run dev
# =================================================================================================
# INDESY MIALY
# C4-FC3B-A1 — RECOVERY + VALIDATION
# Windows PowerShell 5.1 SAFE
#
# À exécuter APRÈS Ctrl+C
#
# NO COMMIT
# NO PUSH
# NO SUPABASE MUTATION
# NO REGISTRY CHANGE
# =================================================================================================

$ErrorActionPreference = "Stop"

$ProjectRoot = "D:\Dev\indesy-mialy"
$ExpectedBranch = "work/indesy-completeness"
$ExpectedHead = "08b0dcbb7e4e566f83eb7efeafadb026d4845ae5"

Set-Location -LiteralPath $ProjectRoot

$env:GIT_PAGER = "cat"
$env:PAGER = "cat"

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# =================================================================================================
# HELPERS
# =================================================================================================

function Write-Section {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Title
    )

    Write-Host ""
    Write-Host "================================================================================"
    Write-Host " $Title"
    Write-Host "================================================================================"
}

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    $Parent = Split-Path -Parent $Path

    if (
        -not [string]::IsNullOrWhiteSpace($Parent) -and
        -not (Test-Path -LiteralPath $Parent)
    ) {
        [void](
            New-Item `
                -ItemType Directory `
                -Path $Parent `
                -Force
        )
    }

    [System.IO.File]::WriteAllText(
        $Path,
        $Content,
        $Utf8NoBom
    )
}

function Read-Utf8 {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Fichier introuvable : $Path"
    }

    return [System.IO.File]::ReadAllText(
        $Path,
        [System.Text.Encoding]::UTF8
    )
}

function Invoke-NativeChecked {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Executable,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    Write-Host ""
    Write-Host ">>> $Label"

    & $Executable @Arguments

    $ExitCode = $LASTEXITCODE

    if ($ExitCode -ne 0) {
        throw "${Label} a échoué avec exit code $ExitCode."
    }
}

function Get-DirtyPaths {

    $Status = @(
        & git.exe status --porcelain=v1 -uall
    )

    if ($LASTEXITCODE -ne 0) {
        throw "git status a échoué."
    }

    foreach ($Line in $Status) {

        if ([string]::IsNullOrWhiteSpace($Line)) {
            continue
        }

        if ($Line.Length -lt 4) {
            throw "Ligne git status invalide : $Line"
        }

        $Path = $Line.Substring(3).Trim()

        if ($Path.Contains(" -> ")) {
            throw "Rename inattendu détecté : $Line"
        }

        $Path.Replace("\", "/")
    }
}

function Assert-Contains {
    param(
        [string]$Content,
        [string]$Needle,
        [string]$Label
    )

    if (-not $Content.Contains($Needle)) {
        throw "Assertion échouée : $Label"
    }
}

function Assert-NotMatch {
    param(
        [string]$Content,
        [string]$Pattern,
        [string]$Label
    )

    if ($Content -match $Pattern) {
        throw "Assertion échouée : $Label"
    }
}

# =================================================================================================
# 1. SAFETY RECOVERY
# =================================================================================================

Write-Section "1. SAFETY RECOVERY"

$Branch = (& git.exe branch --show-current).Trim()

if ($LASTEXITCODE -ne 0) {
    throw "git branch a échoué."
}

$Head = (& git.exe rev-parse HEAD).Trim()

if ($LASTEXITCODE -ne 0) {
    throw "git rev-parse HEAD a échoué."
}

if ($Branch -ne $ExpectedBranch) {
    throw @"
Branche inattendue.

EXPECTED=$ExpectedBranch
ACTUAL=$Branch
"@
}

if ($Head -ne $ExpectedHead) {
    throw @"
HEAD inattendu.

EXPECTED=$ExpectedHead
ACTUAL=$Head
"@
}

$AllowedDirtyPaths = @(
    "app/marketplace/layout.tsx",
    "docs/verification/C4-FC3B-marketplace-visual.md",
    "modules/marketplace/components/MarketplaceShell.tsx",
    "modules/marketplace/components/ProductCard.tsx",
    "modules/marketplace/features/CatalogFeature.tsx",
    "modules/marketplace/marketplace-visual-contract.test.mjs"
)

$DirtyPaths = @(
    Get-DirtyPaths |
        Sort-Object -Unique
)

foreach ($Path in $DirtyPaths) {

    if ($AllowedDirtyPaths -notcontains $Path) {
        throw @"
Modification hors scope détectée :

$Path

Le script s'arrête pour ne pas toucher à une modification étrangère à FC3B-A1.
"@
    }
}

Write-Host "BRANCH=$Branch"
Write-Host "HEAD=$Head"
Write-Host "RECOVERY_DIRTY_FILE_COUNT=$($DirtyPaths.Count)"
Write-Host "RECOVERY_SCOPE_SAFE=True"

# =================================================================================================
# 2. VERIFY FILES CREATED BEFORE INTERRUPTION
# =================================================================================================

Write-Section "2. VERIFY EXISTING FC3B-A1 FILES"

$MarketplaceShellPath = Join-Path `
    $ProjectRoot `
    "modules\marketplace\components\MarketplaceShell.tsx"

$MarketplaceLayoutPath = Join-Path `
    $ProjectRoot `
    "app\marketplace\layout.tsx"

$ProductCardPath = Join-Path `
    $ProjectRoot `
    "modules\marketplace\components\ProductCard.tsx"

$CatalogFeaturePath = Join-Path `
    $ProjectRoot `
    "modules\marketplace\features\CatalogFeature.tsx"

$VisualContractTestPath = Join-Path `
    $ProjectRoot `
    "modules\marketplace\marketplace-visual-contract.test.mjs"

$VerificationDocumentPath = Join-Path `
    $ProjectRoot `
    "docs\verification\C4-FC3B-marketplace-visual.md"

$RuntimeRepositoryPath = Join-Path `
    $ProjectRoot `
    "modules\marketplace-core\repositories\marketplace-runtime.repository.ts"

$ExpectedGeneratedFiles = @(
    $MarketplaceShellPath,
    $MarketplaceLayoutPath,
    $ProductCardPath,
    $CatalogFeaturePath,
    $VisualContractTestPath
)

foreach ($Path in $ExpectedGeneratedFiles) {

    if (-not (Test-Path -LiteralPath $Path)) {
        throw @"
Le premier script ne s'est pas exécuté assez loin.

Fichier attendu manquant :
$Path
"@
    }

    Write-Host "FOUND=$Path"
}

# =================================================================================================
# 3. VERIFY REAL MARKETPLACE AUTHORITY
# =================================================================================================

Write-Section "3. REAL MARKETPLACE AUTHORITY"

$RuntimeRepository = Read-Utf8 `
    -Path $RuntimeRepositoryPath

$RequiredAuthorities = @(
    'from("marketplace_products")',
    'from("marketplace_product_images")',
    'from("marketplace_carts")',
    'from("marketplace_cart_items")',
    'rpc("marketplace_checkout"',
    'from("marketplace_orders")'
)

foreach ($Authority in $RequiredAuthorities) {

    Assert-Contains `
        -Content $RuntimeRepository `
        -Needle $Authority `
        -Label "Autorité Marketplace absente : $Authority"

    Write-Host "AUTHORITY_OK=$Authority"
}

Write-Host "REAL_MARKETPLACE_RUNTIME=True"

# =================================================================================================
# 4. VERIFY GENERATED PUBLIC UI
# =================================================================================================

Write-Section "4. VERIFY GENERATED PUBLIC UI"

$ShellSource = Read-Utf8 `
    -Path $MarketplaceShellPath

$LayoutSource = Read-Utf8 `
    -Path $MarketplaceLayoutPath

$ProductCardSource = Read-Utf8 `
    -Path $ProductCardPath

$CatalogSource = Read-Utf8 `
    -Path $CatalogFeaturePath

Assert-Contains `
    -Content $ShellSource `
    -Needle "Indesy Bazar" `
    -Label "MarketplaceShell incomplet."

Assert-Contains `
    -Content $LayoutSource `
    -Needle "MarketplaceShell" `
    -Label "Le layout Marketplace n'utilise pas MarketplaceShell."

Assert-Contains `
    -Content $ProductCardSource `
    -Needle "product.images[0]" `
    -Label "ProductCard ne rend pas les médias persistants."

Assert-Contains `
    -Content $CatalogSource `
    -Needle "catalog.result.total" `
    -Label "Le catalogue n'utilise pas le total réel."

Assert-Contains `
    -Content $CatalogSource `
    -Needle "store.useCase.addToCart" `
    -Label "Le catalogue n'utilise pas le vrai use-case panier."

Assert-NotMatch `
    -Content $CatalogSource `
    -Pattern 'MarketplaceStore|marketProducts|rashguard-boeny|gants-mfn-pro|cage-location' `
    -Label "Données prototype détectées dans CatalogFeature."

Assert-NotMatch `
    -Content $ProductCardSource `
    -Pattern 'MarketplaceStore|marketProducts|rashguard-boeny|gants-mfn-pro|cage-location' `
    -Label "Données prototype détectées dans ProductCard."

Write-Host "INDESY_BAZAR_SHELL=True"
Write-Host "PUBLIC_REAL_CATALOG=True"
Write-Host "PUBLIC_REAL_PRODUCT_MEDIA=True"
Write-Host "PUBLIC_REAL_CART_USE_CASE=True"
Write-Host "PUBLIC_MARKETPLACE_PROTOTYPE_RUNTIME=False"

# =================================================================================================
# 5. CREATE VISUAL ACCEPTANCE DOCUMENT
#
# Important :
# Aucun triple backtick à l'intérieur du here-string.
# Cela évite le problème du copier-coller précédent.
# =================================================================================================

Write-Section "5. CREATE VISUAL ACCEPTANCE DOCUMENT"

$VerificationDocumentSource = @'
# C4-FC3B — Indesy Bazar visual acceptance

## Purpose

This validation concerns the real Supabase-backed public Marketplace.

The following legacy sources are NOT accepted as production runtime authorities:

- modules/marketplace-prototype
- modules/erp-marketplace/mocks.ts

The public Marketplace must use the actual Marketplace modules and persistent
Supabase authorities already present in Indesy Mialy.

## Start the application

From the VS Code PowerShell terminal run:

    npm.cmd run dev

Then open the routes below.

## Main Marketplace routes

Catalogue:

    http://localhost:3000/marketplace

Real product detail:

    http://localhost:3000/marketplace/products/57368beb-caf9-49b2-a90e-54d31ed984c2

Favorites:

    http://localhost:3000/marketplace/favorites

Cart:

    http://localhost:3000/marketplace/cart

Checkout:

    http://localhost:3000/marketplace/checkout

Orders:

    http://localhost:3000/marketplace/orders

Rentals:

    http://localhost:3000/marketplace/rentals

Seller Marketplace:

    http://localhost:3000/dashboard/vendeur/marketplace

## Catalogue acceptance

Expected:

- Indesy Bazar shell is visible.
- Catalogue navigation is visible.
- Favorites navigation is visible.
- Cart navigation is visible.
- Orders navigation is visible.
- Rentals navigation is visible.
- Marketplace global search is visible.
- Persisted Marketplace products are rendered.
- Persisted product images are rendered.
- Product title is visible.
- Seller is visible.
- Location is visible when persisted.
- Stock is visible.
- Price is visible.
- Search remains usable.
- Transaction-type filtering remains usable.
- Category filtering remains usable.
- Location filtering remains usable.
- Sorting remains usable.
- Pagination remains usable.
- Empty results remain truthful.
- No demo product is displayed.

## Product detail acceptance

Expected:

- real persisted title
- persisted image
- persisted seller
- persisted location
- persisted stock
- persisted price
- add-to-cart action for sale products
- rental dates only for rental products
- no fabricated payment confirmation
- no locally generated fake order

## Anonymous visitor

Expected:

- public catalogue remains readable when allowed by RLS
- public product detail remains readable when allowed by RLS
- favorite mutation must not silently succeed
- cart mutation must not silently succeed
- authentication errors must remain visible

## Authenticated buyer

Expected:

- adding a favorite persists
- favorite survives refresh
- adding a product to cart persists
- cart survives refresh
- checkout uses the backend authority
- generated order survives refresh
- payment state is never fabricated client-side

## Desktop visual check

Recommended viewport:

    1440px or wider

Expected:

- compact hero
- multiple product columns
- readable product media
- usable navigation
- usable filters
- no excessive empty vertical space

## Mobile visual check

Recommended viewport:

    approximately 390px wide

Expected:

- Marketplace navigation scrolls horizontally
- no page-level horizontal overflow
- cards collapse to one column
- images stay inside cards
- filters remain usable
- buttons remain reachable

## Theme validation

Verify both:

- dark theme
- light theme

Expected:

- readable text
- visible borders
- active Marketplace navigation is identifiable
- product images remain readable
- red / graphite / silver Indesy visual identity remains coherent

## Seller route note

The canonical seller Marketplace route is:

    http://localhost:3000/dashboard/vendeur/marketplace

It currently uses SellerMarketplaceFeature.

The legacy ErpMarketplaceWorkspace is NOT considered production complete while
it still imports marketplace-prototype or ERP mock sources.

Therefore this A1 phase must NOT promote ERP Marketplace registry entries yet.