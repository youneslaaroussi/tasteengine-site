import { motion } from "motion/react";
import { useMemo } from "react";
import { MarkdownAsync } from "react-markdown";
import typewriterHook from "../functions/typewriterHook";
import { MarkdownTypewriterProps } from "../interfaces";

export default async function MarkdownTypewriterAsync(props: MarkdownTypewriterProps) {
    const { delay = 10, children: text, motionProps = {}, components: externalComponents, ...rest } = props;
    const { characterVariants, onCharacterAnimationComplete, ...restMotionProps } = motionProps;
    const { sentenceVariants, components } = typewriterHook({
        delay,
        characterVariants,
        onCharacterAnimationComplete,
    });

    const mergedComponents = useMemo(
        () => ({
            ...components,
            ...(externalComponents || {}),
        }),
        [components, externalComponents]
    );

    const key = useMemo(() => `typewriter-${typeof text === "string" ? text.slice(0, 32) : ""}`, [text]);

    const markdown = await MarkdownAsync({
        ...rest,
        components: mergedComponents,
        children: text,
    });

    return (
        <motion.span key={key} variants={sentenceVariants} initial='hidden' animate={"visible"} {...restMotionProps}>
            {markdown}
        </motion.span>
    );
}
