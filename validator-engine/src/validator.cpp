#include "validator.hpp"

#include <algorithm>
#include <chrono>
#include <regex>
#include <sstream>
#include <stdexcept>

namespace {

std::string escape_json(const std::string& value) {
  std::string output;
  output.reserve(value.size() + 8);
  for (const char character : value) {
    switch (character) {
      case '\\': output += "\\\\"; break;
      case '"': output += "\\\""; break;
      case '\n': output += "\\n"; break;
      case '\r': output += "\\r"; break;
      case '\t': output += "\\t"; break;
      default: output += character;
    }
  }
  return output;
}

std::string string_field(const std::string& json, const std::string& key) {
  const std::regex pattern("\\\"" + key + "\\\"\\s*:\\s*\\\"((?:\\\\.|[^\\\"])*)\\\"");
  std::smatch match;
  return std::regex_search(json, match, pattern) ? match[1].str() : "";
}

int integer_field(const std::string& json, const std::string& key) {
  const std::regex pattern("\\\"" + key + "\\\"\\s*:\\s*(-?[0-9]+)");
  std::smatch match;
  return std::regex_search(json, match, pattern) ? std::stoi(match[1].str()) : 0;
}

bool boolean_field(const std::string& json, const std::string& key) {
  const std::regex pattern("\\\"" + key + "\\\"\\s*:\\s*(true|false)");
  std::smatch match;
  return std::regex_search(json, match, pattern) && match[1].str() == "true";
}

std::vector<std::string> string_array_field(const std::string& json, const std::string& key) {
  const std::regex array_pattern("\\\"" + key + "\\\"\\s*:\\s*\\[([^\\]]*)\\]");
  std::smatch array_match;
  if (!std::regex_search(json, array_match, array_pattern)) return {};

  std::vector<std::string> values;
  const std::string body = array_match[1].str();
  const std::regex value_pattern("\\\"([^\\\"]+)\\\"");
  for (auto iterator = std::sregex_iterator(body.begin(), body.end(), value_pattern);
       iterator != std::sregex_iterator(); ++iterator) {
    values.push_back((*iterator)[1].str());
  }
  return values;
}

void add_issue(std::vector<gcp::Issue>& target, std::string severity, std::string code,
               std::string title, std::string detail, std::string path) {
  target.push_back({std::move(severity), std::move(code), std::move(title),
                    std::move(detail), std::move(path)});
}

std::string issues_to_json(const std::vector<gcp::Issue>& issues) {
  std::ostringstream output;
  output << '[';
  for (std::size_t index = 0; index < issues.size(); ++index) {
    if (index > 0) output << ',';
    const auto& issue = issues[index];
    output << "{\"severity\":\"" << escape_json(issue.severity)
           << "\",\"code\":\"" << escape_json(issue.code)
           << "\",\"title\":\"" << escape_json(issue.title)
           << "\",\"detail\":\"" << escape_json(issue.detail)
           << "\",\"path\":\"" << escape_json(issue.path) << "\"}";
  }
  output << ']';
  return output.str();
}

}  // namespace

namespace gcp {

Manifest parse_manifest(const std::string& json) {
  if (json.empty() || json.find('{') == std::string::npos) {
    throw std::invalid_argument("A JSON object is required.");
  }
  Manifest manifest;
  manifest.id = string_field(json, "id");
  manifest.name = string_field(json, "name");
  manifest.slug = string_field(json, "slug");
  manifest.starts_at = string_field(json, "startsAt");
  manifest.ends_at = string_field(json, "endsAt");
  manifest.item_count = integer_field(json, "itemCount");
  manifest.mission_count = integer_field(json, "missionCount");
  manifest.reward_count = integer_field(json, "rewardCount");
  manifest.bundle_count = integer_field(json, "bundleCount");
  manifest.locales = string_array_field(json, "locales");
  manifest.broken = boolean_field(json, "broken");
  return manifest;
}

Report validate(const Manifest& manifest) {
  const auto started = std::chrono::steady_clock::now();
  Report report;

  if (!std::regex_match(manifest.id, std::regex("EVT_[A-Z0-9_]+"))) {
    add_issue(report.errors, "error", "ID_001", "Invalid event identifier",
              "Event IDs must start with EVT_ and contain uppercase letters, digits, or underscores.", "event.id");
  }
  if (manifest.name.empty()) {
    add_issue(report.errors, "error", "VAL_001", "Display name is required",
              "The event must have a player-facing display name.", "event.name");
  }
  if (!std::regex_match(manifest.slug, std::regex("[a-z0-9]+(?:-[a-z0-9]+)*"))) {
    add_issue(report.errors, "error", "VAL_002", "Invalid publication slug",
              "Use a lowercase, hyphen-separated slug before publishing.", "event.slug");
  }
  if (manifest.starts_at.empty() || manifest.ends_at.empty() || manifest.ends_at <= manifest.starts_at) {
    add_issue(report.errors, "error", "DATE_003", "Invalid event window",
              "The end date must be later than the start date.", "event.window");
  }
  if (manifest.item_count < 1) {
    add_issue(report.errors, "error", "CNT_002", "No items configured",
              "At least one item is required.", "content.items");
  }
  if (manifest.mission_count < 1) {
    add_issue(report.errors, "error", "CNT_003", "No missions configured",
              "At least one mission is required.", "content.missions");
  }
  if (manifest.reward_count < manifest.mission_count) {
    add_issue(report.errors, "error", "CNT_004", "Insufficient rewards",
              "Every mission must have at least one configured reward.", "content.rewards");
  }
  if (manifest.bundle_count < 0) {
    add_issue(report.errors, "error", "PRICE_001", "Invalid bundle count",
              "Bundle counts cannot be negative.", "content.bundles");
  }
  if (manifest.broken) {
    add_issue(report.errors, "error", "REF_004", "Item reference not found",
              "rewards[17].item_id points to ITEM_WINTER_ORB_99, which does not exist.", "rewards[17].item_id");
  }

  for (const std::string required : {"pt-BR", "en-US", "es-MX"}) {
    if (std::find(manifest.locales.begin(), manifest.locales.end(), required) == manifest.locales.end()) {
      add_issue(report.warnings, "warning", "LOC_011", "Required translation missing",
                required + " is missing from title or description.", "localization." + required);
    }
  }

  report.valid = report.errors.empty();
  report.duration_ms = std::max<long long>(1, std::chrono::duration_cast<std::chrono::milliseconds>(
    std::chrono::steady_clock::now() - started).count());
  return report;
}

std::string report_to_json(const Report& report) {
  std::ostringstream output;
  output << "{\"valid\":" << (report.valid ? "true" : "false")
         << ",\"checkedRules\":" << report.checked_rules
         << ",\"errors\":" << issues_to_json(report.errors)
         << ",\"warnings\":" << issues_to_json(report.warnings)
         << ",\"durationMs\":" << report.duration_ms
         << ",\"engine\":\"game-content-validator/c++20-1.0\"}";
  return output.str();
}

}  // namespace gcp
