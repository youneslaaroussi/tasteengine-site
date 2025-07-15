import emojiRegex from "emoji-regex";
import { motion, Variants } from "motion/react";
import { Key, ReactElement, RefObject, useRef } from "react";

function throttle(func: (...args: any[]) => void, limit: number) {
    let lastCall = 0;
    return (...args: any[]) => {
        const now = Date.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            func(...args);
        }
    };
}

// Separate component for each character to avoid Rules of Hooks violations
function CharacterSpan({ 
    char, 
    className, 
    characterVariants, 
    onCharacterAnimationComplete, 
    spanKey 
}: {
    char: string;
    className?: string;
    characterVariants: Variants;
    onCharacterAnimationComplete?: (letterRef: RefObject<HTMLSpanElement | null>) => void;
    spanKey: string;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const onAnimationComplete = onCharacterAnimationComplete
        ? throttle(() => onCharacterAnimationComplete(ref), 10)
        : undefined;

    // Log character span creation and animation states
    console.log(`[CharacterSpan] Rendering char: "${char}" with key: ${spanKey}`);

    return (
        <motion.span
            ref={ref}
            className={className}
            key={spanKey}
            variants={characterVariants}
            onAnimationComplete={(definition) => {
                console.log(`[CharacterSpan] Animation complete for char: "${char}" (${spanKey})`);
                if (onAnimationComplete) onAnimationComplete();
            }}
            onAnimationStart={(definition) => {
                console.log(`[CharacterSpan] Animation started for char: "${char}" (${spanKey})`);
            }}
        >
            {char}
        </motion.span>
    );
}

/**
 * Splits a string into an array of characters, preserving emojis as single elements.
 *
 * For example:
 *
 * - "Hello" -> ["H", "e", "l", "l", "o"]
 * - "Hello 😊" -> ["H", "e", "l", "l", "o", " ", "😊"]
 * @param str The input string to split.
 * @returns An array of characters and emojis.
 */
function splitStringToCharactersAndEmoji(str: string): string[] {
    const regex = emojiRegex();
    const result: string[] = [];
    let lastIndex = 0;

    str.replace(regex, (match, offset) => {
        if (offset > lastIndex) {
            result.push(...str.slice(lastIndex, offset).split(""));
        }
        result.push(match);
        lastIndex = offset + match.length;
        return match;
    });

    if (lastIndex < str.length) {
        result.push(...str.slice(lastIndex).split(""));
    }

    return result;
}

export default function TypewriterItem({
    children,
    className,
    characterVariants,
    dadElement,
    onCharacterAnimationComplete,
    itemKey,
}: {
    children: any;
    className?: string;
    characterVariants: Variants;
    dadElement: (children: ReactElement | ReactElement[], isString?: boolean) => ReactElement | ReactElement[];
    onCharacterAnimationComplete?: (letterRef: RefObject<HTMLSpanElement | null>) => void;
    key?: Key | null | undefined;
    itemKey?: string;
}) {
    const charCounter = useRef(0);
    if (typeof children === "string") {
        const effectiveKey = itemKey;
        console.log(`[TypewriterItem] Processing string: "${children}" (${children.length} chars) with key: ${itemKey}, effectiveKey: ${effectiveKey}`);
        
        // check if is emoji
        const characters = splitStringToCharactersAndEmoji(children);
        console.log(`[TypewriterItem] Split into ${characters.length} characters:`, characters);
        
        const spanList = characters.map((char) => {
            const charKey = `span-${effectiveKey}-${charCounter.current++}`;
            return (
                <CharacterSpan
                    key={charKey}
                    char={char}
                    className={className}
                    characterVariants={characterVariants}
                    onCharacterAnimationComplete={onCharacterAnimationComplete}
                    spanKey={charKey}
                />
            );
        });
        return dadElement(spanList, true);
    } else if (Array.isArray(children)) {
        const effectiveKey = itemKey;
        const list = children.map((child) => {
            if (typeof child === "string") {
                let spanList = child.split("").map((char) => {
                    const charKey = `span-${effectiveKey}-${charCounter.current++}`;
                    return (
                        <CharacterSpan
                            key={charKey}
                            char={char}
                            className={className}
                            characterVariants={characterVariants}
                            onCharacterAnimationComplete={onCharacterAnimationComplete}
                            spanKey={charKey}
                        />
                    );
                });
                return spanList;
            }
            return child;
        });
        return dadElement(list);
    }
    return dadElement(children, true);
}
