// Type definitions for mori 0.3.2
// Project: http://swannodette.github.io/mori/
// Definitions by: Robert Koeninger <https://github.com/rkoeninger/>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

interface SeqOf<A> { }
interface SetOf<A> { }
interface Associative { }
type Seq = SeqOf<any>;
type Set = SeqOf<any>;
type CollOf<A> = SetOf<A> | SeqOf<A> | A[];
type Coll = CollOf<any>;
type Pred<A> = (x: A) => boolean;

/**
 * Interface for core mori functions.
 */
interface Mori {
    /** Test whether two values are equal. Works on all Mori collections. Note that two seqable values will be tested on deep equality of their contents. */
    hash(x: any): number;
    /** Returns the hash code for a value. Values for which mori.equals returns true have identical hash codes. */
    equals(x: any, y: any): boolean;
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
    /** Constructs an immutable list. Lists support efficient addition at the head of the list. It's important to remember that the cost of operations like mori.nth will be linear in the size of the list. */
    list<A>(...args: A[]): CollOf<A>;
    /** Constructs an immutable vector. Vectors support efficient addition at the end. They also support efficient random access. You will probably use mori.vector much more often than mori.list */
    vector<A>(...args: A[]): CollOf<A>;
    /** Constructs an immutable hash map. Unlike JavaScript objects Mori PersistentHashMap support complex keys. It's recommended that you only use immutable values for your keys - numbers, strings or a Mori collection. */
    hashMap(...args: any[]): Associative;
    /** Like a hash map but keeps its keys ordered. */
    sorted_map(...args: any[]): Associative;
    /** Constructs a collection of unique items. You may pass in any seqable type - this includes JavaScript arrays and strings. There are several operations unique to sets which do not apply to the other collections. */
    set<A>(seqable: CollOf<A>): SetOf<A>;
    /** Like set but keeps its elements ordered. */
    sortedSet<A>(...args: A[]): SetOf<A>;
    /** Construct a potentially infinite lazy range of values. With no parameters, a infinite lazy sequence starting at 0 will be returned. A single parameter serves as the end (exclusive) argument. Two parameters serve as start and end. If three parameters are specified, the third serves as a step argument. */
    range(start?: number, end?: number, step?: number): SeqOf<number>;
    /** Constructs a persistent queue. Queues support efficient addition at the end and removal from the front. */
    queue<A>(...args: A[]): CollOf<A>;
    /** Add something to a collection. The behavior depends on the type of the collection. */
    conj<A>(coll: CollOf<A>, ...args: A[]): CollOf<A>;
    /** Add all the items in the second collection to the first one as if calling mori.conj repeatedly. */
    into<A>(coll: CollOf<A>, from: CollOf<A>): CollOf<A>;
    /** Associate a new key-value pair in an associative collection. Works on vectors and maps. */
    assoc(coll: Associative, ...args: any[]): Associative;
    /** Removes keys from an associative collection. Works on maps. */
    dissoc(coll: Associative, ...args: any[]): Associative;
    /** Returns a sequence of the elements of coll with duplicates removed. */
    distinct(coll: Coll): Coll;
    /** Remove everything from a collection. */
    empty(coll: Coll): Coll;
    /** Retrieve a value from a collection. */
    get(coll: Coll, key: any, notFound: any): any;
    /** Retrieve a value from a nested collection. keys may be any seqable object. */
    getIn(coll: Coll, keys: Coll, notFound: any): any;
    /** Returns true if the collection has the given key/index. Otherwise, returns false. */
    hasKey(coll: Coll, key: any): boolean;
    /** Returns the key value pair as an array for a given key. Returns null if that key isn't present. */
    find(coll: Associative, key: any): any[];
    /** Get the value at the specified index. Complexity depends on the collection. nth is essentially constant on vector, but linear on lists. For collections which are not sequential like sets and hash-map, the collection will be coerced into a sequence first. */
    nth<A>(coll: CollOf<A>, index: number): A;
    /** Get the last value in a collection, in linear time. */
    last<A>(coll: CollOf<A>): A;
    /** Convenience function for assoc'ing nested associative data structures. keys may be any seqable. */
    assocIn(coll: Associative, keys: any, val: any): Associative;
    /** Convenience function for update'ing nested associative data structures. keys may be any seqable. */
    updateIn(coll: Associative, keys: any, f: (x: any) => any): Associative;
    /** Returns the length of the collection. */
    count(coll: Coll): number;
    /** Returns true if the collection is empty. */
    isEmpty(coll: Coll): boolean;
    /** Returns either the first item of a list or the last item of a vector. */
    peek<A>(coll: CollOf<A>): A;
    /** Returns either a list with the first item removed or a vector with the last item removed. */
    pop<A>(coll: CollOf<A>): A;
    /** Takes two seqable objects and constructs a hash map. The first seqable provides the keys, the second seqable the values. */
    zipmap(seqable0: Seq, seqable1: Seq): Associative;
    /** Returns a reversed sequence of a collection. */
    reverse<A>(coll: SeqOf<A>): SeqOf<A>;
    /** Returns a subsection of a vector in constant time. */
    subvec(vector: any, start: number, end?: number): any;
    /** Returns the keys of a hash map as a sequence. */
    keys(map: Associative): Seq;
    /** Returns the values of a hash map as a sequence. */
    values(map: Associative): Seq;
    /** Returns the result of conj-ing the rest of the maps into the first map. If any of the keys exist in the previous map, they will be overridden. */
    merge(...maps: Associative[]): Associative;
    /** Removes an element from a set. */
    disj<A>(set: SetOf<A>, value: any): SetOf<A>;
    /** Returns the union of two sets. */
    union(...sets: Set[]): Set;
    /** Returns the intersection of two sets. */
    intersection(...sets: Set[]): Set;
    /** Returns the difference between two sets. */
    difference(...sets: Set[]): Set;
    /** Returns true if seta is a subset of setb. */
    isSubset<A extends B, B>(seta: SetOf<A>, setb: SetOf<B>): boolean;
    /** Returns true if seta is a superset of setb. */
    isSuperset<A, B extends A>(seta: SetOf<A>, setb: SetOf<B>): boolean;
    /** Returns the first element in a collection. */
    first<A>(coll: CollOf<A>): A;
    /** Returns the remaining elements in a collection. */
    rest<A>(coll: CollOf<A>): CollOf<A>;
    /** Converts a collection whether Mori or JavaScript primitive into a sequence. */
    seq<A>(coll: CollOf<A>): SeqOf<A>;
    /** Converts a collection into a sequence and adds a value to the front. */
    cons(val: any, coll: Coll): Seq;
    /** Converts its arguments into sequences and concatenates them. */
    concat(...colls: Coll[]): Seq;
    /** Converts an arbitrarily nested collection into a flat sequence. */
    flatten(coll: any): Seq;
    /** Converts a seqable collection, including Mori seqs back into a JavaScript array. Non-lazy. */
    intoArray<A>(seq: CollOf<A>): A[];
    /** Iterate over a collection. For side effects. */
    each<A>(coll: CollOf<A>, f: (x: A) => void): void;
    /** Return a lazy sequence that represents the original collection with f applied to each element. Note that map can take multiple collections This obviates the need for Underscore.js's zip. */
    map(f: (...any) => any, ...colls: Coll[]): Seq;
    /** Applies f, which must return a collection, to each element of the original collection(s) and concatenates the results into a single sequence. */
    mapcat(f: (...any) => any, ...colls: Coll[]): Seq;
    /** Return a lazy sequence representing the original collection filtered of elements which did not return a truthy value for pred. Note that Mori has a stricter notion of truth than JavaScript. Only false, undefined, and null are considered false values. */
    filter<A>(pred: Pred<A>, coll: CollOf<A>): SeqOf<A>;
    /** The inverse of filter. Return a lazy sequence representing the original collction filtered of elements which returned a truthy value for pred. Note that Mori has a stricter notion of truth than JavaScript. Only false, undefined, and null are considered false values. */
    remove<A>(pred: Pred<A>, coll: CollOf<A>): SeqOf<A>;
    /** Accumulate a collection into a single value. f should be a function of two arguments, the first will be the accumulator, the second will be next value in the sequence. */
    reduce(f, intialOrColl, coll?): any;
    /** A variant of reduce for map-like collections, specifically hash maps and vectors. */
    reduceKV(f, initialOrMap, map?): any;
    /** Takes n elements from a colletion. Note that coll could be an infinite sequence. This function returns a lazy sequence. */
    take<A>(n: number, coll: CollOf<A>): SeqOf<A>;
    /** Takes elements from a collection as long as the function pred returns a value other than false, null or undefined. Returns a lazy sequence. */
    takeWhile<A>(pred: Pred<A>, coll: CollOf<A>): SeqOf<A>;
    /** Drop n elements from a collection. Returns a lazy sequence. */
    drop<A>(n: number, coll: CollOf<A>): SeqOf<A>;
    /** Drops elements from a collection as long as the function pred returns a value other than false, null or undefined. Returns a lazy sequence. */
    dropWhile<A>(pred: Pred<A>, coll: CollOf<A>): SeqOf<A>;
    /** Applies the function pred to the elements of the collection in order and returns the first result which is not false, null or undefined. */
    some<A>(pred: Pred<A>, coll: CollOf<A>): A;
    /** Returns true if the result of applying the function pred to an element of the collection is never false, null or undefined. */
    every<A>(pred: Pred<A>, coll: CollOf<A>): boolean;
    /** Sorts the collection and returns a sequence. The comparison function to be used can be given as the first argument. */
    sort<A>(cmpOrColl: ((x: A, y: A) => number) | CollOf<A>, coll?: CollOf<A>): CollOf<A>;
    /** Sorts the collection by the values of keyfn on the elements and returns a sequence. The comparison function to be used can be given as the first argument. */
    sortBy(keyfn: (x: any) => any, cmpOrColl, coll?): any;
    /** Interpose a value between all elements of a collection. */
    interpose(x: any, coll: Coll): Coll;
    /** Interleave two or more collections. The size of the resulting lazy sequence is determined by the smallest collection. */
    interleave(...colls: Coll[]): Coll;
    /** Creates a lazy sequences of x, f(x), f(f(x)), ... */
    iterate(f: (x: any) => any, x: any): any;
    /** Return a lazy of sequence of the value repeated. If given n, the value will only be repeated n times. */
    repeat<A>(nOrX: number | A, x?: A): SeqOf<A>;
    /** Return a lazy of sequence of calling f, a function which takes no arguments (presumably for side effects). If given n, the function will only be repeated n times. */
    repeatedly(nOrF: number | (() => any), f?: () => any): Seq;
    /** Partition a seqable collection into groups of n items. An optional step parameter may be provided to specify the amount of overlap. An additional pad element can be provided when the final group of items is too small. */
    partition(n: number, stepOrPadOrColl, padOrColl?, coll?): any;
    /** Partition a seqable collection with a new group being started whenever the value of the function f changes. */
    partitionBy(f: (x: any) => any, coll: Coll): any;
    /** Returns a map of the items grouped by the result of applying f to the element. */
    groupBy(f: (x: any) => any, coll: Coll): any;
    /** There are many array-like JavaScript objects which are not actually arrays. To give these objects a uniform interface you can wrap them with mori.primSeq. The optional argument index may be used to specify an offset. Note this is not necesary for arrays or strings. */
    primSeq(seqable: any, index?: number): any;
    /** A function which simply returns its argument. */
    identity<A>(x: A): A;
    /** Makes a function that takes any number of arguments and simply returns x. */
    constantly<A>(x: A): (...any) => A
    /** Adds one to its argument. */
    inc(n: number): number;
    /** Subtracts one from its argument. */
    dec(n: number): number;
    /** Add its two arguments together. Useful with mori.reduce. */
    sum(a: number, b: number): number;
    /** Returns true if the argument is divisible by 2. */
    isEven(n: number): boolean;
    /** Returns true if the argument is not divisible by 2. */
    isOdd(n: number): boolean;
    /** Function composition. The result of mori.comp(f, g)(x) is the same as f(g(x)). */
    comp<A, B, C>(f: (x: B) => C, g: (x: A) => B): (x: A) => C;
    /** Takes a series of functions and creates a single function which represents their "juxtaposition". When this function is called, will return the result of each function applied to the arguments in a JavaScript array. */
    juxt(...fs: any[]): any;
    /** This allows you to create functions that work on a heterogenous collection and return a new collection of the same arity. It is an relative of juxt. Like juxt it takes a series of functions and returns a new function. Unlike juxt the resulting function takes a sequence. The functions and sequence are zipped together and invoked. */
    knit(...fs: any[]): any;
    /** Allows threading a value through a series of functions. */
    pipeline(x: any, ...fs: any[]): any;
    /** Partial application. Will return a new function in which the provided arguments have been partially applied. */
    partial(f: any, ...args: any[]): any;
    /** Curry arguments to a function. */
    curry(f: any, ...args: any[]): any;
    /** Takes a function f and returns a new function that upon receiving an argument, if null, will be replaced with x. fnil may take up to three arguments. */
    fnil(f, x?: any, y?: any, z?: any): any;
    /** Recursively transforms JavaScript arrays into Mori vectors, and JavaScript objects into Mori maps. */
    toClj(x: any): any;
    /** Recursively transforms Mori values to JavaScript. sets/vectors/lists/queues become Arrays, Keywords and Symbol become Strings, Maps become Objects. Arbitrary keys are encoded to by key->js. */
    toJs(x: any): any;
}

declare module "mori" {
    export = mori;
}

declare var mori: Mori;
