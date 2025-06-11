module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['typed-rocks'],
    rules: {
        'typed-rocks/no-complex-types': ['error', {
            union: {
                inner: 3
            },
            intersection: {
                // inner: 3
            },
            depth: 3,
            combined: {
                // inner: 3
            }
        }],
    },
};
