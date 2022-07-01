import { observer } from "mobx-react-lite";
import React, { useMemo } from "react";
import { Loading } from "../../shared/components/Loading";
import { useApplicationState } from "../state/ApplicationStateContext";

export const BytesViewer = observer(function BytesViewer() {
  const state = useApplicationState();
  const { buffer, loading, error, page, selection } = state;

  const bytesPerLine = 40;
  const linesPerPage = 30;
  const lineCount = Math.ceil((buffer?.byteLength ?? 0) / bytesPerLine);
  const numPages = Math.ceil(lineCount / linesPerPage);
  const pageStart = page * linesPerPage;

  type BytesAndChars = [JSX.Element[], JSX.Element[]];

  const lines = useMemo(() => {
    if (!buffer) {
      return [];
    }

    const view = new Uint8Array(buffer);

    const chunkRow = (chunkOffset: number): BytesAndChars => {
      const chunk = view.slice(chunkOffset, chunkOffset + bytesPerLine);
      return chunk.reduce(
        (children, value, index) => {
          children[0][index] = (
            <span
              key={chunkOffset + index}
              className={value == 0 ? "text-gray-300" : "text-inherit"}
              data-byte-offset={chunkOffset + index}
            >
              {value.toString(16).padStart(2, "0")}
            </span>
          );
          children[1][index] = (
            <span
              key={chunkOffset + index}
              className={value == 0 ? "text-gray-300" : "text-inherit"}
              data-byte-offset={chunkOffset + index}
            >
              {toAscii(value)}
            </span>
          );
          return children;
        },
        [new Array<JSX.Element>(bytesPerLine), new Array<JSX.Element>(bytesPerLine)]
      );
    };

    const lines = [new Array<JSX.Element>(), new Array<JSX.Element>()];
    for (let chunkOffset = 0, index = 0; chunkOffset < view.length; chunkOffset += bytesPerLine, index++) {
      const [bytes, chars] = chunkRow(chunkOffset);
      lines[0].push(<React.Fragment key={chunkOffset}>{bytes}</React.Fragment>);
      lines[1].push(<React.Fragment key={chunkOffset}>{chars}</React.Fragment>);
    }

    return lines;
  }, [buffer]);

  if (loading) {
    return <Loading />;
  }

  if (!buffer && error) {
    return <>{error}</>;
  }

  if (!buffer) {
    return null;
  }

  const buttonStyles: JSX.IntrinsicElements["button"] = {
    className: "bg-gray-300 px-2 py-1  disabled:text-gray-400",
    style: {
      width: "15ch",
    },
  };

  const bytes = lines[0].slice(pageStart, pageStart + linesPerPage);
  const chars = lines[1].slice(pageStart, pageStart + linesPerPage);

  return (
    <div className="py-8 font-mono">
      <div className="hex-viewer">
        <div>
          <div className="bytes">{bytes}</div>
          <div className="chars">{chars}</div>
        </div>
      </div>
      <div className="m-4 flex gap-4 text-gray-700 justify-center">
        <button disabled={page == 0} onClick={() => state.setPage(0)} {...buttonStyles}>
          First Page
        </button>
        <button disabled={page == 0} onClick={() => state.setPage(page - 1)} {...buttonStyles}>
          Previous Page
        </button>
        <button disabled={page == numPages - 1} onClick={() => state.setPage(page + 1)} {...buttonStyles}>
          Next Page
        </button>
        <button disabled={page == numPages - 1} onClick={() => state.setPage(numPages - 1)} {...buttonStyles}>
          Last Page
        </button>
      </div>
    </div>
  );
});

const toAscii = (chr: number) => {
  if (chr < 32 || chr > 126) {
    return ".";
  }

  if (chr == 32) {
    return <>&nbsp;</>;
  }

  return String.fromCharCode(chr);
};
