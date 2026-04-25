// System Words — English
//
// The vocabulary branch of the AI's constraint envelope.
// Parallel to grammarClustering.en.js (structure branch) and word bank (learner branch).
//
// This is circle 2: all words the system knows about at each level, per atom.
// It is authored deliberately — not pipeline-generated.
// The cluster filter in buildCircle2 narrows this to atoms at C1..currentCluster.
//
// The learner's word bank is the ON/OFF toggle over this pool.
// gap = SYSTEM_WORDS[level][atom] - learner's banked words = AI restrictions.
//
// A2+ entries to be added as the system expands.

export const SYSTEM_WORDS = {
  A1: {

    // ── Cluster 1 ────────────────────────────────────────────────
    personal_pronoun: [
      'i', 'you', 'he', 'she', 'we', 'they',
    ],

    object_pronoun: [
      'me', 'him', 'her', 'us', 'them',
    ],

    noun: [
      'food', 'water', 'house', 'room', 'friend', 'bag',
      'music', 'night', 'work', 'book', 'table', 'door',
      'name', 'day', 'time', 'home', 'family', 'phone',
      'word', 'place', 'man', 'woman', 'child', 'teacher',
      'student', 'school', 'city', 'money', 'car', 'thing',
      'bread', 'coffee', 'tea', 'drink',
    ],

    lexical_verb: [
      'want', 'go', 'have', 'like', 'eat', 'run', 'walk',
      'help', 'make', 'give', 'take', 'see', 'know', 'think',
      'speak', 'say', 'read', 'write', 'get', 'come', 'sleep',
      'play', 'open', 'close', 'drink', 'work', 'look',
      'love', 'hate', 'need',
    ],

    interjection: [
      'hello', 'yes', 'no', 'please', 'sorry', 'okay',
      'thanks',
    ],

    // ── Cluster 2 ────────────────────────────────────────────────
    copula: [
      'be',
    ],

    adjective: [
      'good', 'bad', 'big', 'small', 'happy', 'sad',
      'tired', 'hungry', 'cold', 'hot', 'new', 'old',
      'nice', 'busy', 'ready', 'free', 'right', 'wrong',
      'easy', 'hard',
    ],

    determiner: [
      'a', 'an', 'the', 'some',
    ],

    possessive_determiner: [
      'my', 'your', 'his', 'her', 'our', 'their',
    ],

    demonstrative: [
      'this', 'that', 'these', 'those',
    ],

    numeral: [
      'one', 'two', 'three', 'four', 'five',
      'six', 'seven', 'eight', 'nine', 'ten',
    ],

    interrogative: [
      'what', 'where', 'who', 'when', 'why', 'how',
    ],

    // ── Cluster 3 ────────────────────────────────────────────────
    adverb: [
      'here', 'there', 'now', 'today', 'always', 'never',
      'very', 'too', 'also', 'again', 'home', 'outside',
      'inside', 'together', 'already', 'still',
    ],

    preposition: [
      'in', 'on', 'at', 'to', 'from', 'with', 'for',
      'of', 'about', 'near', 'between',
    ],

    conjunction: [
      'and', 'but', 'or', 'because', 'if', 'when', 'so',
    ],

    // ── Cluster 4 ────────────────────────────────────────────────
    modal_auxiliary: [
      'can', 'will', 'would',
    ],

    negation_marker: [
      'not',
    ],

    auxiliary: [
      'do', 'does',
    ],

    // progressive_auxiliary is a structure-unlock (derived from copula).
    // No words listed here — it shares copula's words at runtime.

  },
}
