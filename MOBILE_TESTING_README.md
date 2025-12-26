# Mobile App Testing - Setup Instructions

## ⚠️ Current Status

The mobile app testing setup has **dependency conflicts** with React 19. Jest and React Native Testing Library are not yet fully compatible with React 19.

## Options

### Option 1: Wait for React 19 Support (Recommended)
Wait for `jest-expo` and `@testing-library/react-native` to add full React 19 support.

### Option 2: Downgrade React (Not Recommended)
Downgrade to React 18 to use current testing libraries.

### Option 3: Use Expo's Built-in Testing (When Available)
Expo may release their own testing solution compatible with React 19.

## What's Ready

The following files are prepared and ready to use once dependencies are compatible:
- ✅ `jest.config.js` - Jest configuration
- ✅ `jest.setup.js` - Test setup with mocks
- ✅ `src/services/__tests__/storage.test.ts` - Sample test
- ✅ `src/utils/__tests__/utils.test.ts` - Sample test

## Temporary Workaround

For now, focus on:
1. **Admin Portal Testing** - Fully working with Vitest ✅
2. **Backend Testing** - Fully working with pytest ✅
3. **Manual Mobile App Testing** - Use the app directly

## When Dependencies Are Ready

Once the dependencies support React 19, install with:

```bash
npm install --save-dev jest-expo @testing-library/react-native
```

Then add these scripts to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Check Compatibility

Monitor these packages for React 19 support:
- [jest-expo](https://www.npmjs.com/package/jest-expo)
- [@testing-library/react-native](https://www.npmjs.com/package/@testing-library/react-native)

---

*Last Updated: 2025-12-26*
*Issue: React 19 dependency conflicts*
