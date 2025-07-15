import { Variants } from "motion/react";
import { RefObject, useMemo } from "react";
import markdownComponents from "../functions/markdownComponents";
import { MarkdownTypewriterProps } from "../interfaces";

export default function typewriterHook(props: {
    delay?: MarkdownTypewriterProps["delay"];
    onCharacterAnimationComplete?: (letterRef: RefObject<HTMLSpanElement | null>) => void;
    characterVariants?: Variants;
    isStreaming?: boolean;
}) {
    const {
        delay = 10,
        characterVariants: letterVariantsProp = {
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { opacity: { duration: 0 } } },
        },
        onCharacterAnimationComplete,
        isStreaming = false,
    } = props;
    const sentenceVariants = useMemo<Variants>(
        () => ({
            hidden: {},
            visible: { opacity: 1, transition: { staggerChildren: delay / 1000 } },
        }),
        [delay]
    );
    const characterVariants = useMemo<Variants>(() => letterVariantsProp, [delay]);
    const components = useMemo(
        () =>
            markdownComponents({
                characterVariants,
                onCharacterAnimationComplete,
                delay,
                isStreaming,
            }),
        [delay, characterVariants, onCharacterAnimationComplete, isStreaming]
    );

    return {
        sentenceVariants,
        components,
    };
}
