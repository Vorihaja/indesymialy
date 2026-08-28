"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  KoranaFeedMedia,
} from "../feed.types";

import {
  makeGetKoranaMediaUrlsUseCase,
} from "../factories/korana-media.factory";


export function useKoranaMediaUrls(
  media:
    KoranaFeedMedia[],
) {

  const useCase =
    useMemo(
      () =>
        makeGetKoranaMediaUrlsUseCase(),
      [],
    );


  const key =
    media
      .map(
        (item) =>
          item.storagePath,
      )
      .join("|");


  const [
    urls,
    setUrls,
  ] =
    useState<
      Record<string, string>
    >({});


  const [
    loading,
    setLoading,
  ] =
    useState(
      media.length > 0,
    );


  useEffect(
    () => {

      let cancelled =
        false;


      async function load() {

        const paths =
          media.map(
            (item) =>
              item.storagePath,
          );


        if (
          paths.length === 0
        ) {

          setUrls(
            {},
          );

          setLoading(
            false,
          );

          return;
        }


        setLoading(
          true,
        );


        const signed =
          await useCase.execute(
            paths,
          );


        if (cancelled) {
          return;
        }


        const next:
          Record<string, string> =
            {};


        for (
          const item
          of signed
        ) {

          next[
            item.storagePath
          ] =
            item.url;
        }


        setUrls(
          next,
        );

        setLoading(
          false,
        );
      }


      void load();


      const timer =
        window.setInterval(
          () => {
            void load();
          },
          50 * 60 * 1000,
        );


      return () => {

        cancelled =
          true;

        window.clearInterval(
          timer,
        );
      };

    },
    [
      key,
      useCase,
    ],
  );


  return {
    urls,
    loading,
  };
}