# Features

Business logic for builtin features that don’t have a particular reason to fit into another place (like serverboard or leveling which fit into database).

From a MVC perspective this is pretty much a `controllers/` directory.

All files export a single method with the name of the feature.

## Input types

All features take a single object with named arguments. These obviously differ from one feature to another, though similar/identical features are named consistently.

## Return types

We try to keep feature return types consisent, however this doesn’t mean identical as that’s simply not viable.

There’s three shapes to expect, always considering that `return type = Success | Failure`:

SHAPE A:

```ts
type Success = {
  success: true;
  feature: string;
  out: ... // this one depends on the feature
}
type Failure = {
  success: false;
  feature: string;
  out: {
    title: string;
    reason: string;
  } // yes, you can just pass { ...failure.out } to errorEmbed()
}

// use literal value of `success` to tell types of "out" apart
```

SHAPE B:

```ts
type Success = {
  success: true;
  feature: string;
  out: ContainerBuilder; // pre-made, just reply with it no matter what
};
type Failure = {
  success: false;
  feature: string;
  out: {
    title: string;
    reason: string;
  }; // yes, you can just pass { ...failure.out } to errorEmbed()
};

// use literal value of `success` to tell types of "out" apart
```

SHAPE C:

```ts
type Success = void;
type Failure = void;
```

Shape A is for _Interkorable_ features, as it’s required to always return neutral data that can be used to build both a Container or an HTTP response.

Shape B and C are for features that only exist on Discord. B is preferred, however features that involve collectors and other strange patterns where there’s not just one final success embed will return `void` to signal that the view logic got trapped inside the controller so as to keep things working.

Shape C features will respond to the interaction for you, so just end the command handler with `return [await] feature()`.

> [!TIP]
> Separation of duties is still achieved in Shape C, it’s just not as pretty. View-related functions are declared before controller-related ones, then used accordingly.
