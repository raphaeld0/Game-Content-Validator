#include "validator.hpp"

#include <iostream>
#include <iterator>
#include <string>

int main() {
  try {
    const std::string input(std::istreambuf_iterator<char>(std::cin), {});
    const auto manifest = gcp::parse_manifest(input);
    std::cout << gcp::report_to_json(gcp::validate(manifest));
    return 0;
  } catch (const std::exception& error) {
    std::cerr << error.what();
    return 2;
  }
}
