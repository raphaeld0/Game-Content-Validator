#pragma once

#include <string>
#include <vector>

namespace gcp {

struct Issue {
  std::string severity;
  std::string code;
  std::string title;
  std::string detail;
  std::string path;
};

struct Manifest {
  std::string id;
  std::string name;
  std::string slug;
  std::string starts_at;
  std::string ends_at;
  int item_count = 0;
  int mission_count = 0;
  int reward_count = 0;
  int bundle_count = 0;
  std::vector<std::string> locales;
  bool broken = false;
};

struct Report {
  bool valid = false;
  int checked_rules = 24;
  long long duration_ms = 0;
  std::vector<Issue> errors;
  std::vector<Issue> warnings;
};

Manifest parse_manifest(const std::string& json);
Report validate(const Manifest& manifest);
std::string report_to_json(const Report& report);

}  // namespace gcp
