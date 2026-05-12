/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { clearPendingHomeRestore, getHomeRestoreState, getProfileSlugFromHomePath, readPendingHomeRestore } from "../utils/homeScrollState";

export default function ScrollToTop() {
  const { pathname, hash, state } = useLocation();

  useEffect(() => {
    const homeProfileSlug = getProfileSlugFromHomePath(pathname);
    if (homeProfileSlug) {
      const explicitRestore = getHomeRestoreState(state);
      const pendingRestore = readPendingHomeRestore(homeProfileSlug);
      const shouldPreserveHomeScroll =
        Boolean(hash) ||
        explicitRestore?.profileSlug === homeProfileSlug ||
        pendingRestore?.profileSlug === homeProfileSlug;

      if (shouldPreserveHomeScroll) {
        return;
      }

      clearPendingHomeRestore(homeProfileSlug);
    }

    window.scrollTo(0, 0);
  }, [hash, pathname, state]);

  return null;
}
