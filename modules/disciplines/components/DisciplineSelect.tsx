"use client";

import {
  Check,
  ChevronDown,
  Search,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ChangeEventHandler,
  type CSSProperties,
} from "react";

import { createPortal } from "react-dom";

import { useDisciplineOptions } from "../hooks/useDisciplineOptions";


export type DisciplineSelectMode =
  | "single"
  | "multiple";

export type DisciplineSelectValueMode =
  | "id"
  | "name"
  | "slug";


export type DisciplineSelectOption = {
  id: string;
  name: string;
  slug?: string | null;
};


export type DisciplineSelectProps = {
  mode?: DisciplineSelectMode;

  valueMode?: DisciplineSelectValueMode;

  value?: string;

  values?: string[];

  onValueChange?: (
    value: string,
  ) => void;

  onValuesChange?: (
    values: string[],
  ) => void;

  /*
   * Compatibilité avec l'ancien DisciplineSelect natif.
   * Les écrans déjà existants peuvent continuer à utiliser :
   *
   * onChange={(event) => ... event.target.value}
   *
   * pendant leur migration progressive.
   */
  onChange?: ChangeEventHandler<HTMLSelectElement>;

  options?: DisciplineSelectOption[];

  emptyLabel?: string;

  allSelectedLabel?: string;

  searchPlaceholder?: string;

  preserveValue?: boolean;

  searchable?: boolean;

  clearable?: boolean;

  showSelectAll?: boolean;

  disabled?: boolean;

  required?: boolean;

  className?: string;

  id?: string;

  name?: string;

  title?: string;

  "aria-label"?: string;

  "aria-describedby"?: string;
};


type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  openUp: boolean;
};


const DEFAULT_TRIGGER_CLASS = [
  "flex",
  "min-h-10",
  "w-full",
  "items-center",
  "justify-between",
  "gap-3",
  "border",
  "border-[#343840]",
  "bg-[#0b0f15]",
  "px-3",
  "py-2",
  "text-left",
  "text-[11px]",
  "text-[#f3f6fa]",
  "outline-none",
  "transition",
  "hover:border-[#4b5563]",
  "focus:border-[#3d92ff]",
  "disabled:cursor-not-allowed",
  "disabled:opacity-50",
].join(" ");


function valueForOption(
  option: DisciplineSelectOption,
  mode: DisciplineSelectValueMode,
): string {
  if (mode === "id") {
    return option.id;
  }

  if (mode === "slug") {
    return option.slug ?? option.id;
  }

  return option.name;
}


function uniqueValues(
  values: string[],
): string[] {
  return Array.from(
    new Set(
      values.filter(Boolean),
    ),
  );
}


export function DisciplineSelect({
  mode = "single",
  valueMode = "name",
  value = "",
  values = [],
  onValueChange,
  onValuesChange,
  onChange,
  options,
  emptyLabel = "Sélectionner une discipline",
  allSelectedLabel,
  searchPlaceholder = "Rechercher une discipline...",
  preserveValue = true,
  searchable = true,
  clearable = true,
  showSelectAll = true,
  disabled = false,
  required = false,
  className = "",
  id,
  name,
  title,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: DisciplineSelectProps) {
  const {
    items,
    loading,
    error,
  } = useDisciplineOptions();

  const generatedId = useId();

  const menuId =
    `${generatedId}-discipline-menu`;

  const triggerRef =
    useRef<HTMLButtonElement | null>(
      null,
    );

  const menuRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [mounted, setMounted] =
    useState(false);

  const [open, setOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [position, setPosition] =
    useState<MenuPosition>({
      top: 0,
      left: 0,
      width: 280,
      maxHeight: 360,
      openUp: false,
    });


  const sourceOptions =
    useMemo<DisciplineSelectOption[]>(
      () =>
        options ??
        items.map(
          (item) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
          }),
        ),
      [
        items,
        options,
      ],
    );


  const effectiveLoading =
    options
      ? false
      : loading;

  const effectiveError =
    options
      ? null
      : error;


  const allValues =
    useMemo(
      () =>
        uniqueValues(
          sourceOptions.map(
            (option) =>
              valueForOption(
                option,
                valueMode,
              ),
          ),
        ),
      [
        sourceOptions,
        valueMode,
      ],
    );


  const knownValues =
    useMemo(
      () =>
        new Set(
          allValues,
        ),
      [
        allValues,
      ],
    );


  const effectiveSingleValue =
    useMemo(
      () => {
        if (!value) {
          return "";
        }

        if (
          preserveValue ||
          knownValues.has(value)
        ) {
          return value;
        }

        return "";
      },
      [
        knownValues,
        preserveValue,
        value,
      ],
    );


  const selectedValues =
    useMemo(
      () =>
        mode === "multiple"
          ? uniqueValues(values)
          : effectiveSingleValue
            ? [effectiveSingleValue]
            : [],
      [
        effectiveSingleValue,
        mode,
        values,
      ],
    );


  const selectedSet =
    useMemo(
      () =>
        new Set(
          selectedValues,
        ),
      [
        selectedValues,
      ],
    );


  const selectedOptions =
    useMemo(
      () =>
        sourceOptions.filter(
          (option) =>
            selectedSet.has(
              valueForOption(
                option,
                valueMode,
              ),
            ),
        ),
      [
        selectedSet,
        sourceOptions,
        valueMode,
      ],
    );


  const allSelected =
    allValues.length > 0 &&
    allValues.every(
      (item) =>
        selectedSet.has(item),
    );


  const filteredOptions =
    useMemo(
      () => {
        const normalized =
          search
            .trim()
            .toLocaleLowerCase(
              "fr-FR",
            );

        if (!normalized) {
          return sourceOptions;
        }

        return sourceOptions.filter(
          (option) =>
            [
              option.name,
              option.slug ?? "",
            ].some(
              (candidate) =>
                candidate
                  .toLocaleLowerCase(
                    "fr-FR",
                  )
                  .includes(
                    normalized,
                  ),
            ),
        );
      },
      [
        search,
        sourceOptions,
      ],
    );


  const summary =
    useMemo(
      () => {
        if (
          effectiveLoading &&
          sourceOptions.length === 0
        ) {
          return "Chargement…";
        }

        if (
          effectiveError &&
          sourceOptions.length === 0
        ) {
          return "Disciplines indisponibles";
        }

        if (
          mode === "single"
        ) {
          const selected =
            selectedOptions[0];

          if (selected) {
            return selected.name;
          }

          if (
            effectiveSingleValue &&
            preserveValue
          ) {
            return effectiveSingleValue;
          }

          return emptyLabel;
        }

        if (
          selectedValues.length === 0
        ) {
          return emptyLabel;
        }

        if (
          allSelected &&
          allSelectedLabel
        ) {
          return allSelectedLabel;
        }

        if (
          selectedOptions.length === 1
        ) {
          return selectedOptions[0].name;
        }

        if (
          selectedOptions.length === 2 &&
          selectedValues.length === 2
        ) {
          return selectedOptions
            .map(
              (item) =>
                item.name,
            )
            .join(", ");
        }

        return `${selectedValues.length} disciplines sélectionnées`;
      },
      [
        allSelected,
        allSelectedLabel,
        effectiveError,
        effectiveLoading,
        effectiveSingleValue,
        emptyLabel,
        mode,
        preserveValue,
        selectedOptions,
        selectedValues.length,
        sourceOptions.length,
      ],
    );


  const updatePosition =
    useCallback(
      () => {
        const trigger =
          triggerRef.current;

        if (!trigger) {
          return;
        }

        const rect =
          trigger.getBoundingClientRect();

        const viewportWidth =
          window.innerWidth;

        const viewportHeight =
          window.innerHeight;

        const gap = 6;

        const width =
          Math.min(
            Math.max(
              rect.width,
              270,
            ),
            Math.max(
              220,
              viewportWidth - 16,
            ),
          );

        const left =
          Math.min(
            Math.max(
              8,
              rect.left,
            ),
            Math.max(
              8,
              viewportWidth -
                width -
                8,
            ),
          );

        const roomBelow =
          viewportHeight -
          rect.bottom -
          gap -
          8;

        const roomAbove =
          rect.top -
          gap -
          8;

        const openUp =
          roomBelow < 240 &&
          roomAbove > roomBelow;

        const available =
          openUp
            ? roomAbove
            : roomBelow;

        const maxHeight =
          Math.max(
            160,
            Math.min(
              420,
              available,
            ),
          );

        setPosition({
          top:
            openUp
              ? rect.top - gap
              : rect.bottom + gap,

          left,

          width,

          maxHeight,

          openUp,
        });
      },
      [],
    );


  const emitLegacyChange =
    useCallback(
      (
        nextValue: string,
      ) => {
        if (!onChange) {
          return;
        }

        const event = {
          target: {
            value: nextValue,
          },
          currentTarget: {
            value: nextValue,
          },
        } as unknown as ChangeEvent<HTMLSelectElement>;

        onChange(
          event,
        );
      },
      [
        onChange,
      ],
    );


  const setSingleValue =
    useCallback(
      (
        nextValue: string,
      ) => {
        onValueChange?.(
          nextValue,
        );

        emitLegacyChange(
          nextValue,
        );
      },
      [
        emitLegacyChange,
        onValueChange,
      ],
    );


  const choose =
    useCallback(
      (
        selectedValue: string,
      ) => {
        if (
          mode === "single"
        ) {
          setSingleValue(
            selectedValue,
          );

          setOpen(
            false,
          );

          return;
        }

        const nextValues =
          selectedSet.has(
            selectedValue,
          )
            ? selectedValues.filter(
                (item) =>
                  item !==
                  selectedValue,
              )
            : [
                ...selectedValues,
                selectedValue,
              ];

        onValuesChange?.(
          uniqueValues(
            nextValues,
          ),
        );
      },
      [
        mode,
        onValuesChange,
        selectedSet,
        selectedValues,
        setSingleValue,
      ],
    );


  const clearSelection =
    useCallback(
      () => {
        if (
          mode === "single"
        ) {
          setSingleValue(
            "",
          );

          return;
        }

        onValuesChange?.(
          [],
        );
      },
      [
        mode,
        onValuesChange,
        setSingleValue,
      ],
    );


  const selectEverything =
    useCallback(
      () => {
        if (
          mode !== "multiple"
        ) {
          return;
        }

        onValuesChange?.(
          allValues,
        );
      },
      [
        allValues,
        mode,
        onValuesChange,
      ],
    );


  useEffect(
    () => {
      setMounted(
        true,
      );

      return () => {
        setMounted(
          false,
        );
      };
    },
    [],
  );


  useEffect(
    () => {
      if (!open) {
        setSearch(
          "",
        );

        return;
      }

      updatePosition();

      const handlePointerDown = (
        event: PointerEvent,
      ) => {
        const target =
          event.target as Node;

        if (
          triggerRef.current?.contains(
            target,
          ) ||
          menuRef.current?.contains(
            target,
          )
        ) {
          return;
        }

        setOpen(
          false,
        );
      };

      const handleKeyDown = (
        event: KeyboardEvent,
      ) => {
        if (
          event.key === "Escape"
        ) {
          setOpen(
            false,
          );

          triggerRef.current?.focus();
        }
      };

      const handleViewportChange =
        () => {
          updatePosition();
        };

      document.addEventListener(
        "pointerdown",
        handlePointerDown,
      );

      document.addEventListener(
        "keydown",
        handleKeyDown,
      );

      window.addEventListener(
        "resize",
        handleViewportChange,
      );

      window.addEventListener(
        "scroll",
        handleViewportChange,
        true,
      );

      return () => {
        document.removeEventListener(
          "pointerdown",
          handlePointerDown,
        );

        document.removeEventListener(
          "keydown",
          handleKeyDown,
        );

        window.removeEventListener(
          "resize",
          handleViewportChange,
        );

        window.removeEventListener(
          "scroll",
          handleViewportChange,
          true,
        );
      };
    },
    [
      open,
      updatePosition,
    ],
  );


  const menuStyle =
    useMemo<CSSProperties>(
      () => ({
        position: "fixed",
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
        transform:
          position.openUp
            ? "translateY(-100%)"
            : undefined,
        zIndex: 1000,
      }),
      [
        position,
      ],
    );


  const listMaxHeight =
    Math.max(
      110,
      position.maxHeight -
        (
          searchable &&
          sourceOptions.length > 6
            ? 118
            : 70
        ),
    );


  const menu =
    open ? (
      <div
        ref={menuRef}
        id={menuId}
        style={menuStyle}
        className="overflow-hidden border border-[#303844] bg-[#090c11] text-[#f3f6fa] shadow-[0_24px_80px_rgba(0,0,0,0.72)]"
      >
        {searchable &&
        sourceOptions.length > 6 ? (
          <div className="border-b border-white/[0.07] bg-[#07090d] p-2.5">
            <label className="flex min-h-9 items-center gap-2 border border-[#303844] bg-[#0e131a] px-2.5 focus-within:border-[#3d92ff]">
              <Search
                size={13}
                className="shrink-0 text-[#778392]"
              />

              <input
                autoFocus
                value={search}
                onChange={
                  (event) =>
                    setSearch(
                      event.target.value,
                    )
                }
                placeholder={
                  searchPlaceholder
                }
                className="min-w-0 flex-1 bg-transparent text-[11px] text-[#f3f6fa] outline-none placeholder:text-[#778392]"
              />

              {search ? (
                <button
                  type="button"
                  onClick={
                    () =>
                      setSearch("")
                  }
                  className="grid h-6 w-6 place-items-center text-[#778392] transition hover:text-white"
                  aria-label="Effacer la recherche"
                >
                  <X
                    size={12}
                  />
                </button>
              ) : null}
            </label>
          </div>
        ) : null}


        <div
          className="overflow-y-auto overscroll-contain py-1"
          style={{
            maxHeight:
              listMaxHeight,
          }}
        >
          {effectiveLoading &&
          sourceOptions.length === 0 ? (
            <div className="px-3 py-5 text-center text-[11px] text-[#778392]">
              Chargement des disciplines…
            </div>
          ) : effectiveError &&
            sourceOptions.length === 0 ? (
            <div className="px-3 py-5 text-center text-[11px] text-[#ff4058]">
              {effectiveError}
            </div>
          ) : filteredOptions.length ===
            0 ? (
            <div className="px-3 py-5 text-center text-[11px] text-[#778392]">
              Aucune discipline trouvée.
            </div>
          ) : (
            filteredOptions.map(
              (option) => {
                const optionValue =
                  valueForOption(
                    option,
                    valueMode,
                  );

                const checked =
                  selectedSet.has(
                    optionValue,
                  );

                return (
                  <label
                    key={
                      option.id
                    }
                    className={[
                      "flex",
                      "min-h-10",
                      "cursor-pointer",
                      "items-center",
                      "gap-3",
                      "border-b",
                      "border-white/[0.045]",
                      "px-3",
                      "py-2",
                      "transition",
                      "last:border-b-0",
                      checked
                        ? "bg-[#3d92ff]/10 text-white"
                        : "text-[#a5b0bf] hover:bg-white/[0.035] hover:text-white",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={
                        checked
                      }
                      onChange={
                        () =>
                          choose(
                            optionValue,
                          )
                      }
                      className="sr-only"
                    />

                    <span
                      className={[
                        "grid",
                        "h-4",
                        "w-4",
                        "shrink-0",
                        "place-items-center",
                        "border",
                        checked
                          ? "border-[#3d92ff] bg-[#3d92ff] text-white"
                          : "border-[#46505d] bg-[#0b0f15] text-transparent",
                      ].join(" ")}
                    >
                      <Check
                        size={11}
                        strokeWidth={3}
                      />
                    </span>

                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">
                      {option.name}
                    </span>
                  </label>
                );
              },
            )
          )}
        </div>


        {mode === "multiple" ||
        (
          clearable &&
          selectedValues.length > 0
        ) ? (
          <footer className="flex min-h-10 items-center justify-between gap-2 border-t border-white/[0.07] bg-[#07090d] px-2.5 py-2">
            <div className="flex items-center gap-2">
              {mode ===
                "multiple" &&
              showSelectAll ? (
                <button
                  type="button"
                  onClick={
                    selectEverything
                  }
                  disabled={
                    allSelected
                  }
                  className="border border-[#3d92ff]/40 bg-[#3d92ff]/10 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#6aafff] transition hover:border-[#3d92ff] disabled:cursor-default disabled:opacity-40"
                >
                  Tout sélectionner
                </button>
              ) : null}

              {clearable &&
              selectedValues.length >
                0 ? (
                <button
                  type="button"
                  onClick={
                    clearSelection
                  }
                  className="border border-[#303844] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#a5b0bf] transition hover:border-[#ff4058]/60 hover:text-[#ff4058]"
                >
                  Effacer
                </button>
              ) : null}
            </div>

            {mode ===
            "multiple" ? (
              <span className="shrink-0 font-mono text-[9px] text-[#778392]">
                {selectedValues.length}
                /
                {sourceOptions.length}
              </span>
            ) : null}
          </footer>
        ) : null}
      </div>
    ) : null;


  return (
    <div className="min-w-0">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={
          disabled ||
          effectiveLoading
        }
        title={title}
        aria-label={
          ariaLabel ??
          emptyLabel
        }
        aria-describedby={
          ariaDescribedBy
        }
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={
          open
            ? menuId
            : undefined
        }
        aria-required={
          required
            ? true
            : undefined
        }
        onClick={
          () => {
            if (
              disabled ||
              effectiveLoading
            ) {
              return;
            }

            setOpen(
              (current) =>
                !current,
            );
          }
        }
        onKeyDown={
          (event) => {
            if (
              event.key ===
                "ArrowDown" &&
              !open
            ) {
              event.preventDefault();

              setOpen(
                true,
              );
            }
          }
        }
        className={[
          DEFAULT_TRIGGER_CLASS,
          open
            ? "border-[#3d92ff]"
            : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span
          className={[
            "min-w-0",
            "flex-1",
            "truncate",
            selectedValues.length
              ? "text-[#f3f6fa]"
              : "text-[#778392]",
          ].join(" ")}
        >
          {summary}
        </span>

        {mode ===
          "multiple" &&
        selectedValues.length >
          0 ? (
          <span className="grid h-5 min-w-5 shrink-0 place-items-center bg-[#3d92ff]/15 px-1.5 font-mono text-[9px] font-bold text-[#6aafff]">
            {
              selectedValues.length
            }
          </span>
        ) : null}

        <ChevronDown
          size={14}
          className={[
            "shrink-0",
            "text-[#778392]",
            "transition-transform",
            open
              ? "rotate-180 text-[#6aafff]"
              : "",
          ].join(" ")}
        />
      </button>


      {name &&
      mode === "single" ? (
        <input
          type="hidden"
          name={name}
          value={
            effectiveSingleValue
          }
        />
      ) : null}


      {name &&
      mode === "multiple"
        ? selectedValues.map(
            (selectedValue) => (
              <input
                key={
                  selectedValue
                }
                type="hidden"
                name={name}
                value={
                  selectedValue
                }
              />
            ),
          )
        : null}


      {mounted &&
      open &&
      typeof document !==
        "undefined"
        ? createPortal(
            menu,
            document.body,
          )
        : null}
    </div>
  );
}