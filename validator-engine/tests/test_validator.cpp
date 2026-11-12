#include "validator.hpp"

#include <cassert>

int main() {
  const auto valid = gcp::parse_manifest(R"({"id":"EVT_WINTER_2026","name":"Winter Rift 2026","slug":"winter-rift-2026","startsAt":"2026-12-03T18:00","endsAt":"2027-01-08T04:00","itemCount":30,"missionCount":5,"rewardCount":30,"bundleCount":3,"locales":["pt-BR","en-US","es-MX"],"broken":false})");
  assert(gcp::validate(valid).valid);

  const auto invalid = gcp::parse_manifest(R"({"id":"bad","name":"","slug":"","startsAt":"2027-01-08","endsAt":"2026-01-08","itemCount":0,"missionCount":0,"rewardCount":0,"bundleCount":0,"locales":["en-US"],"broken":true})");
  const auto report = gcp::validate(invalid);
  assert(!report.valid);
  assert(report.errors.size() >= 5);
  assert(report.warnings.size() == 2);
}
