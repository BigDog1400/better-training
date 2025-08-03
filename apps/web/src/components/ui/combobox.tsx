import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Check, ChevronsUpDown, LoaderIcon } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "./command";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";


interface Props<T extends object> {
    title?: string;
    value?: T;
    valueKey: keyof T;
    disabled?: boolean;
    size?: number;
    renderText: (value: T) => string;
    // Optional custom option renderer for richer list items (e.g., preview GIFs)
    renderOption?: (value: T) => React.ReactNode;
    onChange?: (value: T) => void;
    searchFn: (search: string, offset: number, size: number) => Promise<T[]>;
    debounce?: number;
    // Keep popover open when selecting an item (for rapid multi-add flows)
    keepOpen?: boolean;
}
const ComboBox = <T extends object>({
    title,
    value,
    valueKey,
    disabled = false,
    size = 25,
    renderText,
    renderOption,
    onChange,
    searchFn,
    debounce = 500,
    keepOpen = false,
}: Props<T>) => {
    const [search, setSearch] = useState<string>("");
    const [options, setOptions] = useState<T[]>([]);
    const [canLoadMore, setCanLoadMore] = useState<boolean>(true);
    const debouncedsearch = useDebounce<string>(search, debounce);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const getOptions = useCallback(async () => {
        setIsLoading(true);
        const searchResult = await searchFn(debouncedsearch || "", 0, size);
        if (searchResult.length === 0 || searchResult.length < size) {
            setCanLoadMore(false);
        }
        setOptions(searchResult);
        setIsLoading(false);
    }, [debouncedsearch, searchFn, size]);

    const getMoreOptions = useCallback(async () => {
        setIsLoading(true);
        const searchResult = await searchFn(
            debouncedsearch || "",
            options.length,
            size,
        );
        if (searchResult.length === 0 || searchResult.length < size) {
            setCanLoadMore(false);
        }
        if (
            searchResult[searchResult.length - 1][valueKey] ===
            options[options.length - 1][valueKey]
        ) {
            setCanLoadMore(false);
            return;
        }
        setOptions([...options, ...searchResult]);
        setIsLoading(false);
    }, [debouncedsearch, searchFn, options, valueKey, size]);

    useEffect(() => {
        getOptions();
    }, [getOptions]);

    return (
        <Popover modal={true} open={undefined}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-between",
                        !value && "text-muted-foreground",
                    )}
                    disabled={disabled}
                >
                    <div className="truncate">
                        {value ? renderText(value) : `Select ${title}`}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="PopoverContent p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={`Search ${title}...`}
                        value={typeof search === "string" ? search : ""}
                        onValueChange={(value) => setSearch(value)}
                    />
                    <CommandList>
                        <CommandEmpty>No item found.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-y-auto">
                            <div>
                                {options.map((option) => (
                                    <CommandItem
                                        value={option[valueKey] as string}
                                        key={option[valueKey] as string}
                                        onSelect={(_value) => {
                                            // Radix Command onSelect provides the selected value (string),
                                            // not a DOM event. We keep the popover open using keepOpen by
                                            // not relying on PopoverClose wrapper and simply calling onChange.
                                            onChange?.(option);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                option[valueKey] === value?.[valueKey]
                                                    ? "opacity-100"
                                                    : "opacity-0",
                                            )}
                                        />
                                        <div className="min-w-0 flex-1">
                                            {renderOption ? renderOption(option) : renderText(option)}
                                        </div>
                                    </CommandItem>
                                ))}
                            </div>
                            <CommandItem asChild>
                                {canLoadMore && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-7"
                                        onClick={getMoreOptions}
                                        disabled={isLoading}
                                    >
                                        {isLoading 
                                            ? <LoaderIcon className="w-4 h-4 animate-spin" /> 
                                            : "Load More ↓"}
                                    </Button>
                                )}
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default ComboBox;
