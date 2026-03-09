// template
import React from "react";
import { Platform, ScrollView, ScrollViewProps } from "react-native";

type Props = ScrollViewProps;

export const KeyboardAwareScrollViewCompat = React.forwardRef<ScrollView, Props>(function KeyboardAwareScrollViewCompat(
  { children, keyboardShouldPersistTaps = "handled", ...props },
  ref
) {
  if (Platform.OS === "web") {
    return (
      <ScrollView ref={ref} keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...props}>
        {children}
      </ScrollView>
    );
  }
  return (
    <ScrollView ref={ref} keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...props}>
      {children}
    </ScrollView>
  );
});
