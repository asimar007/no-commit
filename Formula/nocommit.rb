require "language/node"

class Nocommit < Formula
  desc "AI-powered CLI that writes your git commit messages using Google Gemini"
  homepage "https://github.com/asimar007/no-commit"
  url "https://registry.npmjs.org/nocommit/-/nocommit-0.0.3.tgz"
  sha256 "d67372b9c9a04610bf26f853ec03881c9804ca9098444d58d2a24d16fd77638b"
  license "ISC"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/nocommit --version")
  end
end
