package com.richashworth.planningpoker;

import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.model.Round;
import org.springframework.aot.hint.BindingReflectionHintsRegistrar;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;

public class NativeRuntimeHints implements RuntimeHintsRegistrar {

  private final BindingReflectionHintsRegistrar binding = new BindingReflectionHintsRegistrar();

  @Override
  public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
    binding.registerReflectionHints(hints.reflection(), Estimate.class, Round.class);
    try {
      binding.registerReflectionHints(
          hints.reflection(),
          Class.forName("com.richashworth.planningpoker.util.MessagingUtils$Message"),
          Class.forName("com.richashworth.planningpoker.util.MessagingUtils$MessageType"));
    } catch (ClassNotFoundException e) {
      throw new IllegalStateException("Failed to load MessagingUtils inner types for AOT", e);
    }
  }
}
