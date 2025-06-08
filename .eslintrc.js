module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['typed-rocks'],
    rules: {
        'typed-rocks/no-complex-types': ['warn', {
            union: {
                topLevel: Infinity,
                inner: 3
            },
            intersection: {
                topLevel: 6,
                inner: 3
            },
            depth: 3,
            unionAndIntersections: {
                topLevel: 6,
                inner: 4
            }
        }],
    },
};
