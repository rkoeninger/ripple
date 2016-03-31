// Type definitions for mori 0.3.2
// Project: http://swannodette.github.io/mori/
// Definitions by: Robert Koeninger <https://github.com/rkoeninger/>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

interface MoriRange {
    start: number;
    step: number;
    end: number;
}

interface MoriSymbol {
    name: string;
}

interface MoriKeyword {
    name: string;
}

/**
 * Interface for core mori functions.
 */
interface Mori {
    /** Returns the hash code for a value. Values for which mori.equals returns true have identical hash codes. */
    hash(x: any): number;
    /** Test whether two values are equal. Works on all Mori collections. Note that two seqable values will be tested on deep equality of their contents. */
    equals(x: any, y: any): boolean;
    /** Test whether two values are NOT equal. Works on all Mori collections. Note that two seqable values will be tested on deep equality of their contents. */
    notEquals(x: any, y: any): boolean;
    /** Test if something is a list- like collection.Lists support efficient adding to the head. */
    isList(coll: any): boolean;
    /** Test if something is a sequence (i.e.iterable) */
    isSeq(coll: any): boolean;
    /** Test if something is a vector- like collection.Vectors support random access.It is efficient to add to the end of a vector. */
    isVector(coll: any): boolean;
    /** Test if something is a map- like collection.Maps support random access and arbitrary keys. */
    isMap(coll: any): boolean;
    /** Test if something is a hash set. */
    isSet(coll: any): boolean;
    /** Test if something is a collection - lists, maps, sets, vectors are all collections. */
    isCollection(coll: any): boolean;
    /** Test if something is sequential.For example vectors are sequential but are not sequences.They can however be converted into something iterable by calling seq on them. */
    isSequential(coll: any): boolean;
    /** Test if something is associative - i.e.vectors and maps. */
    isAssociative(coll: any): boolean;
    /** Test if something can give its count in O(1) time. */
    isCounted(coll: any): boolean;
    /** Test if something is indexed - i.e.vectors. */
    isIndexed(coll: any): boolean;
    /** Test if something is reduceable. */
    isReduceable(coll: any): boolean;
    /** Test if something can be coerced into something iterable. */
    isSeqable(coll: any): boolean;
    /** Test if something can be reversed in O(1) time. */
    isReversible(coll: any): boolean;
    /** Test if a value is a keyword. */
    isKeyword(x: any): boolean;
    /** Test if a value is a symbol. */
    isSymbol(x: any): boolean;
    /** Constructs an immutable list. Lists support efficient addition at the head of the list. It's important to remember that the cost of operations like mori.nth will be linear in the size of the list. */
    list(...args: any[]): any;
    /** Constructs an immutable vector. Vectors support efficient addition at the end. They also support efficient random access. You will probably use mori.vector much more often than mori.list */
    vector(...args: any[]): any;
    /** Constructs an immutable hash map. Unlike JavaScript objects Mori PersistentHashMap support complex keys. It's recommended that you only use immutable values for your keys - numbers, strings or a Mori collection. */
    hashMap(...args: any[]): any;
    /** Like a hash map but keeps its keys ordered. */
    sorted_map(...args: any[]): any;
    /** Constructs a collection of unique items. You may pass in any seqable type - this includes JavaScript arrays and strings. There are several operations unique to sets which do not apply to the other collections. */
    set(seqable: any): any;
    /** Like set but keeps its elements ordered. */
    sortedSet(...args: any[]): any;
    /** Returns an infinite lazy sequence starting at 0 will be returned. */
    range(): MoriRange;
    /** Returns a lazy sequence from 0 up to, but not including, end. */
    range(end: number): MoriRange;
    /** Returns a lazy sequence from start up to, but not including, end. */
    range(start: number, end: number): MoriRange;
    /** Returns a lazy sequence of numbers from start, incrementing by step, up to, but not including, end. */
    range(start: number, end: number, step: number): MoriRange;
    /** Constructs a persistent queue. Queues support efficient addition at the end and removal from the front. */
    queue(...args: any[]): any;
    /** Add something to a collection. The behavior depends on the type of the collection. */
    conj(coll: any, ...args: any[]): any;
    /** Add all the items in the second collection to the first one as if calling mori.conj repeatedly. */
    into(coll: any, from: any): any;
    /** Associate a new key-value pair in an associative collection. Works on vectors and maps. */
    assoc(coll: any, ...args: any[]): any;
    /** Removes keys from an associative collection. Works on maps. */
    dissoc(coll: any, ...args: any[]): any;
    /** Returns a sequence of the elements of coll with duplicates removed. */
    distinct(coll: any): any;
    /** Remove everything from a collection. */
    empty(coll: any): any;
    /** Retrieve a value from a collection. */
    get(coll: any, key: any, notFound?: any): any;
    /** Retrieve a value from a nested collection. keys may be any seqable object. */
    getIn(coll: any, keys: any, notFound?: any): any;
    /** Returns true if the collection has the given key/index. Otherwise, returns false. */
    hasKey(coll: any, key: any): boolean;
    /** Returns the key value pair as an array for a given key. Returns null if that key isn't present. */
    find(coll: any, key: any): any[];
    /** Get the value at the specified index. Complexity depends on the collection. nth is essentially constant on vector, but linear on lists. For collections which are not sequential like sets and hash-map, the collection will be coerced into a sequence first. */
    nth(coll: any, index: number): any;
    /** Get the last value in a collection, in linear time. */
    last(coll: any): any;
    /** Convenience function for assoc'ing nested associative data structures. keys may be any seqable. */
    assocIn(coll: any, keys: any, val: any): any;
    /** Convenience function for update'ing nested associative data structures. keys may be any seqable. */
    updateIn(coll: any, keys: any, f: (x: any) => any): any;
    /** Returns the length of the collection. */
    count(coll: any): number;
    /** Returns true if the collection is empty. */
    isEmpty(coll: any): boolean;
    /** Returns either the first item of a list or the last item of a vector. */
    peek(coll: any): any;
    /** Returns either a list with the first item removed or a vector with the last item removed. */
    pop(coll: any): any;
    /** Takes two seqable objects and constructs a hash map. The first seqable provides the keys, the second seqable the values. */
    zipmap(seqable0: any, seqable1: any): any;
    /** Returns a reversed sequence of a collection. */
    reverse(coll: any): any;
    /** Returns a subsection of a vector in constant time. */
    subvec(vector: any, start: number, end?: number): any;
    /** coll must be a sorted collection, test(s) one of <, <=, > or >=.
        Returns a seq of those entries with keys ek for which (test (.. sc comparator (compare ek key)) 0) is true */
    subseq(coll: any, test: (x: number, y: number) => boolean, key: any): any;
    /** coll must be a sorted collection, test(s) one of <, <=, > or >=.
        Returns a seq of those entries with keys ek for which (test (.. sc comparator (compare ek key)) 0) is true */
    subseq(coll: any, startTest: (x: number, y: number) => boolean, startKey: any, endTest: (x: number, y: number) => boolean, endKey: any): any;
    /** Returns the keys of a hash map as a sequence. */
    keys(map: any): any;
    /** Returns the values of a hash map as a sequence. */
    values(map: any): any;
    /** Returns the result of conj-ing the rest of the maps into the first map. If any of the keys exist in the previous map, they will be overridden. */
    merge(...maps: any[]): any;
    /** Removes an element from a set. */
    disj(set: any, value: any): any;
    /** Returns the union of two sets. */
    union(...sets: any[]): any;
    /** Returns the intersection of two sets. */
    intersection(...sets: any[]): any;
    /** Returns the difference between two sets. */
    difference(...sets: any[]): any;
    /** Returns true if seta is a subset of setb. */
    isSubset(seta: any, setb: any): boolean;
    /** Returns true if seta is a superset of setb. */
    isSuperset(seta: any, setb: any): boolean;
    /** Returns the first element in a collection. */
    first(coll: any): any;
    /** Returns the second element in a collection. */
    second(coll: any): any;
    /** Returns the remaining elements in a collection. */
    rest(coll: any): any;
    /** Converts a collection whether Mori or JavaScript primitive into a sequence. */
    seq(coll: any): any;
    /** Converts a collection into a sequence and adds a value to the front. */
    cons(val: any, coll: any): any;
    /** Converts its arguments into sequences and concatenates them. */
    concat(...colls: any[]): any;
    /** Converts an arbitrarily nested collection into a flat sequence. */
    flatten(coll: any): any;
    /** Converts a seqable collection, including Mori seqs back into a JavaScript array. Non-lazy. */
    intoArray(seq: any): any[];
    /** Iterate over a collection. For side effects. */
    each(coll: any, f: (x: any) => void): void;
    /** Return a lazy sequence that represents the original collection with f applied to each element. Note that map can take multiple collections This obviates the need for Underscore.js's zip. */
    map(f: (...xs: any[]) => any, ...colls: any[]): any;
    /** Applies f, which must return a collection, to each element of the original collection(s) and concatenates the results into a single sequence. */
    mapcat(f: (...xs: any[]) => any, ...colls: any[]): any;
    /** Return a lazy sequence representing the original collection filtered of elements which did not return a truthy value for pred. Note that Mori has a stricter notion of truth than JavaScript. Only false, undefined, and null are considered false values. */
    filter(pred: (x: any) => boolean, coll: any): any;
    /** The inverse of filter. Return a lazy sequence representing the original collction filtered of elements which returned a truthy value for pred. Note that Mori has a stricter notion of truth than JavaScript. Only false, undefined, and null are considered false values. */
    remove(pred: (x: any) => boolean, coll: any): any;
    /** Accumulate a collection into a single value. f should be a function of two arguments, the first will be the accumulator, the second will be next value in the sequence. Doesn't work properly on empty sequences. */
    reduce(f: (acc: any, val: any) => any, coll: any): any;
    /** Accumulate a collection into a single value. f should be a function of two arguments, the first will be the accumulator, the second will be next value in the sequence. initial is used as the starting accumulator value. */
    reduce(f: (acc: any, val: any) => any, initial: any, coll: any): any;
    /** A variant of reduce for map-like collections, specifically hash maps and vectors. */
    reduceKV(f: (acc: any, key: any, val: any) => any, initial: any, map: any): any;
    /** Takes n elements from a colletion. Note that coll could be an infinite sequence. This function returns a lazy sequence. */
    take(n: number, coll: any): any;
    /** Takes elements from a collection as long as the function pred returns a value other than false, null or undefined. Returns a lazy sequence. */
    takeWhile(pred: (x: any) => boolean, coll: any): any;
    /** Take every nth element from a collection. This function returns a lazy sequence. */
    takeNth(n: number, coll: any): any;
    /** Drop n elements from a collection. Returns a lazy sequence. */
    drop(n: number, coll: any): any;
    /** Drops elements from a collection as long as the function pred returns a value other than false, null or undefined. Returns a lazy sequence. */
    dropWhile(pred: (x: any) => boolean, coll: any): any;
    /** Applies the function pred to the elements of the collection in order and returns the first result which is not false, null or undefined. */
    some(pred: (x: any) => boolean, coll: any): any;
    /** Returns true if the result of applying the function pred to an element of the collection is never false, null or undefined. */
    every(pred: (x: any) => boolean, coll: any): boolean;
    /** Sorts the collection and returns a sequence. */
    sort(coll: any): any;
    /** Sorts the collection and returns a sequence using cmp as the comparison function. */
    sort(cmp: (x: any, y: any) => number, coll: any): any;
    /** Sorts the collection by the values of keyfn on the elements and returns a sequence. */
    sortBy(keyfn: (x: any) => any, coll: any): any;
    /** Sorts the collection by the values of keyfn on the elements and returns a sequence using cmp as the comparison function. */
    sortBy(keyfn: (x: any) => any, cmp: (x: any, y: any) => number, coll: any): any;
    /** Interpose a value between all elements of a collection. */
    interpose(x: any, coll: any): any;
    /** Interleave two or more collections. The size of the resulting lazy sequence is determined by the smallest collection. */
    interleave(...colls: any[]): any;
    /** Creates a lazy sequences of x, f(x), f(f(x)), ... */
    iterate(f: (x: any) => any, x: any): any;
    /** Returns an infinite lazy of sequence of the value repeated. */
    repeat(x: any): any;
    /** Returns a lazy sequence of the value repeated n times. */
    repeat(n: number, x: any): any;
    /** Return an infinite lazy of sequence of calling f, a function which takes no arguments (presumably for side effects). */
    repeatedly(f: () => any): any;
    /** Return an infinite lazy of sequence of calling f, a function which takes no arguments (presumably for side effects), repeated n times. */
    repeatedly(n: number, f: () => any): any;
    /** Partition a seqable collection into groups of n items. */
    partition(n: number, coll: any): any;
    /** Partition a seqable collection into groups of n items with step specifying the amount of overlap between groups. */
    partition(n: number, step: any, coll: any): any;
    /** Partition a seqable collection into groups of n items with step specifying the amount of overlap between groups and pad is used to fill out the last group if it is too small. */
    partition(n: number, step: any, pad: any, coll): any;
    /** Partition a seqable collection with a new group being started whenever the value of the function f changes. */
    partitionBy(f: (x: any) => any, coll: any): any;
    /** Returns a map of the items grouped by the result of applying f to the element. */
    groupBy(f: (x: any) => any, coll: any): any;
    /** There are many array-like JavaScript objects which are not actually arrays. To give these objects a uniform interface you can wrap them with mori.primSeq. The optional argument index may be used to specify an offset. Note this is not necesary for arrays or strings. */
    primSeq(seqable: any, index?: number): any;
    /** Takes a reducing function f of 2 args and returns a fn suitable for transduce by adding an arity-1 signature that calls cf (default - identity) on the result argument. */
    completing(f: (x: any, f: any) => any, cf?: any): any;
    /** Returns a lazy sequence removing consecutive duplicates in coll. Returns a transducer when no collection is provided. */
    dedupe(coll?: any): any;
    /** Returns a reducible/iterable application of the transducers to the items in coll. Transducers are applied in order as if combined with comp. Note that these applications will be performed every time reduce/iterator is called. */
    eduction(...args: any[]): any;
    /** reduce with a transformation of f (xf). (f) will be called to
        produce the initial value. f should be a reducing
        step function that accepts both 1 and 2 arguments, if it accepts
        only 2 you can add the arity-1 with 'completing'. Returns the result
        of applying (the transformed) xf to init and the first item in coll,
        then applying xf to that result and the 2nd item, etc. If coll
        contains no items, returns init and f is not called. Note that
        certain transforms may inject or skip items. */
    transduce(xform: any, f: (...xs: any[]) => any, coll: any): any;
    /** reduce with a transformation of f (xf). f should be a reducing
        step function that accepts both 1 and 2 arguments, if it accepts
        only 2 you can add the arity-1 with 'completing'. Returns the result
        of applying (the transformed) xf to init and the first item in coll,
        then applying xf to that result and the 2nd item, etc. If coll
        contains no items, returns init and f is not called. Note that
        certain transforms may inject or skip items. */
    transduce(xform: any, f: (...xs: any[]) => any, initial: any, coll: any): any;
    /** A function which simply returns its argument. */
    identity<A>(x: A): A;
    /** Makes a function that takes any number of arguments and simply returns x. */
    constantly<A>(x: A): (...xs: any[]) => A
    /** Adds one to its argument. */
    inc(n: number): number;
    /** Subtracts one from its argument. */
    dec(n: number): number;
    /** Greater-than function. */
    gt(x: number, y: number): boolean;
    /** Greater-than or equal function. */
    gte(x: number, y: number): boolean;
    /** Less-than function. */
    lt(x: number, y: number): boolean;
    /** Less-than or equal function. */
    lte(x: number, y: number): boolean;
    /** Add its two arguments together. Useful with mori.reduce. */
    sum(a: number, b: number): number;
    /** Returns true if the argument is divisible by 2. */
    isEven(n: number): boolean;
    /** Returns true if the argument is not divisible by 2. */
    isOdd(n: number): boolean;
    /** Makes a symbol out of a string. */
    symbol(x: string): MoriSymbol;
    /** Makes a keyword out of a string. */
    keyword(x: string): MoriKeyword;
    /** Function composition. The result of mori.comp(f, g)(x) is the same as f(g(x)). */
    comp<A, B, C>(f: (x: B) => C, g: (x: A) => B): (x: A) => C;
    /** Takes a series of functions and creates a single function which represents their "juxtaposition". When this function is called, will return the result of each function applied to the arguments in a JavaScript array. */
    juxt(...fs: any[]): any;
    /** This allows you to create functions that work on a heterogenous collection and return a new collection of the same arity. It is an relative of juxt. Like juxt it takes a series of functions and returns a new function. Unlike juxt the resulting function takes a sequence. The functions and sequence are zipped together and invoked. */
    knit(...fs: any[]): any;
    /** Allows threading a value through a series of functions. */
    pipeline(x: any, ...fs: any[]): any;
    /** Applies f to the list of arguments. Can take variable arguments, but last arg must be a sequence of remaining arguments. */
    apply(f: (...xs: any[]) => any, ...args: any[]): any;
    /** Partial application. Will return a new function in which the provided arguments have been partially applied. */
    partial(f: (...xs: any[]) => any, ...args: any[]): any;
    /** Curry arguments to a function. */
    curry(f: (...xs: any[]) => any, ...args: any[]): any;
    /** Takes a function f and returns a new function that upon receiving an argument, if null, will be replaced with x. fnil may take up to three arguments. */
    fnil(f: (...xs: any[]) => any, x?: any, y?: any, z?: any): any;
    /** Recursively transforms JavaScript arrays into Mori vectors, and JavaScript objects into Mori maps. */
    toClj(x: any): any;
    /** Recursively transforms Mori values to JavaScript. sets/vectors/lists/queues become Arrays, Keywords and Symbol become Strings, Maps become Objects. Arbitrary keys are encoded to by key->js. */
    toJs(x: any): any;
}

declare module "mori" {
    export = mori;
}

declare var mori: Mori;
